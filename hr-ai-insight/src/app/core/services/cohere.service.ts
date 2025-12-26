import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { AuthUser, AuthorizedEmployee, EmployeeData } from '../../models';
import { EmployeeDataService } from './employee-data.service';
import { environment } from '../../../environments/environment';

/**
 * Cohere AI Service
 * Connects to the Cohere Chat API to generate human-like responses
 * using Tool Use (Function Calling) for on-demand data retrieval.
 */
@Injectable({
    providedIn: 'root'
})
export class CohereService {
    private readonly http = inject(HttpClient);
    private readonly employeeDataService = inject(EmployeeDataService);
    private readonly apiUrl = 'https://api.cohere.com/v1/chat';

    // API key is now loaded from environment file
    private readonly apiKey: string = environment.cohereApiKey;

    private abortController: AbortController | null = null;

    /**
     * Stop any ongoing streaming request
     */
    stopStream(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Generate response using Cohere API with Tool Use
     */
    generateResponse(query: string, employees: AuthorizedEmployee[], user: AuthUser, chatHistory: any[] = []): Observable<string> {
        const responseSubject = new Subject<string>();

        // Initialize new controller for this request
        this.stopStream();
        this.abortController = new AbortController();

        if (!this.apiKey || this.apiKey === 'YOUR_COHERE_API_KEY') {
            return this.generateMockResponse(query, employees, user, chatHistory);
        }

        this.streamResponseWithTools(query, employees, responseSubject, user, chatHistory);
        return responseSubject.asObservable();
    }

    /**
     * Advanced streaming with Tool Use implementation
     */
    private async streamResponseWithTools(
        query: string,
        employees: AuthorizedEmployee[],
        subject: Subject<string>,
        user: AuthUser,
        chatHistory: any[] = []
    ): Promise<void> {
        const signal = this.abortController?.signal;

        try {
            // Define the tool for detailed employee data
            const tools = [
                {
                    name: "get_employee_detailed_data",
                    description: "מתקשר למערכת ה-HR כדי לקבל נתונים מפורטים (שכר, חופשות, ביצועים) עבור עובד ספציפי לפי מזהה.",
                    parameter_definitions: {
                        employee_id: {
                            description: "המזהה הייחודי (ID) של העובד",
                            type: "str",
                            required: true
                        }
                    }
                }
            ];

            const body: any = {
                message: query,
                model: 'command-a-03-2025',
                preamble: this.buildLightPreamble(employees, user),
                temperature: 0.1,
                stream: true,
                tools: tools,
                chat_history: chatHistory
            };

            console.log('Sending Cohere Request:', body);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: signal
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Cohere API Error:', response.status, errorBody);
                throw new Error(`API returned ${response.status}: ${errorBody}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('Response body is null');

            let toolCalls: any[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        const parsed = JSON.parse(line);

                        // Handler for text chunks
                        if (parsed.event_type === 'text-generation') {
                            subject.next(parsed.text);
                        }
                        // Handler for tool calls
                        else if (parsed.event_type === 'tool-calls-generation') {
                            toolCalls = parsed.tool_calls;
                        }
                        // End of stream
                        else if (parsed.event_type === 'stream-end') {
                            // IF we have tool calls, we need to execute them and call API again
                            if (toolCalls && toolCalls.length > 0) {
                                await this.handleToolCalls(query, toolCalls, employees, subject, parsed.chat_history);
                                return; // handleToolCalls will complete the subject
                            }
                            subject.complete();
                            return;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }
            subject.complete();

        } catch (error: any) {
            if (error.name === 'AbortError') {
                subject.complete();
                return;
            }
            console.error('Cohere API Error:', error);
            subject.error(error);
        }
    }

    /**
     * Executes tool calls and makes the second request to Cohere
     */
    private async handleToolCalls(
        originalQuery: string,
        toolCalls: any[],
        employees: AuthorizedEmployee[],
        subject: Subject<string>,
        chatHistory: any[]
    ): Promise<void> {
        const toolResults: any[] = [];

        for (const call of toolCalls) {
            if (call.name === 'get_employee_detailed_data') {
                const employeeId = call.parameters.employee_id;
                const data = await this.employeeDataService.getEmployeeData(employeeId);

                toolResults.push({
                    call: call,
                    outputs: [data ? this.formatEmployeeForAI(data) : { error: "Employee not found" }]
                });
            }
        }

        // Make the second request with tool results
        try {
            const body = {
                message: originalQuery,
                model: 'command-a-03-2025',
                tool_results: toolResults,
                chat_history: chatHistory,
                stream: true,
                force_single_step: true
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body),
                signal: this.abortController?.signal
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error('Response body is null');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.event_type === 'text-generation') {
                            subject.next(parsed.text);
                        } else if (parsed.event_type === 'stream-end') {
                            subject.complete();
                            return;
                        }
                    } catch (e) { continue; }
                }
            }
            subject.complete();

        } catch (error) {
            console.error('Error in tool result submission:', error);
            subject.error(error);
        }
    }

    /**
     * Build the light preamble (basic list only)
     */
    private buildLightPreamble(employees: AuthorizedEmployee[], user: AuthUser): string {
        const employeeList = employees.map(e =>
            `- שם: ${e.name}, כינוי: ${e.nickname}, מזהה: ${e.id || e.number}, מחלקה: ${e.departmentName}, תפקיד: ${e.roleName}, מגדר: ${e.gender === 1 ? 'זכר' : 'נקבה'}`
        ).join('\n');

        const genderInstruction = user.gender === 1
            ? "פנה למשתמש בלשון זכר."
            : "פנה למשתמשת בלשון נקבה.";

        return `אתה עוזר HR חכם בשם "HR Insight". 
לפניך רשימה של עובדים מורשים. 

המשתמש המחובר: ${user.firstName} ${user.lastName} (כינוי: ${user.nickname}), מגדר: ${user.gender === 1 ? 'זכר' : 'נקבה'}.
${genderInstruction}

רשימת עובדים:
${employeeList}

הנחיות:
1. אם נשאלת שאלה על עובד ספציפי, השתמש בכלי "get_employee_detailed_data" כדי לקבל את כל המידע שלו.
2. אל תנחש נתונים שאינם ברשימה לעיל.
3. ענה תמיד בעברית בלבד. אל תשתמש במונחים טכניים באנגלית (כמו JSON field names).
4. הצג את התשובה בצורה אנושית ונעימה ב-Markdown.
5. חשוב: אם ישנם מספר עובדים עם אותו השם, היה אדיב ובקש מהמשתמש להבהיר למי הוא מתכוון. הצג לו רשימה של האפשרויות עם הכינוי ומספר העובד של כל אחד.`;
    }

    /**
     * Format full employee data for AI consumption - Using Hebrew keys to encourage Hebrew response
     */
    private formatEmployeeForAI(e: EmployeeData): any {
        const latestSalary = e.salaryHistory[e.salaryHistory.length - 1];
        return {
            'שם_מלא': e.personalInfo.name,
            'תפקיד': e.personalInfo.roleName,
            'מחלקה': e.personalInfo.departmentName,
            'מנהל_ישיר': e.personalInfo.manager,
            'תאריך_תחילת_עבודה': e.personalInfo.startDate,
            'יתרת_ימי_חופשה': e.timeOff.vacationBalance,
            'יתרת_ימי_מחלה': e.timeOff.sickLeaveBalance,
            'שכר_ברוטו_אחרון': latestSalary.grossSalary,
            'שכר_נטו_אחרון': latestSalary.netSalary,
            'דירוג_ביצועים': e.performanceRating
        };
    }

    private generateMockResponse(query: string, employees: AuthorizedEmployee[], user: AuthUser, chatHistory: any[] = []): Observable<string> {
        const subject = new Subject<string>();

        (async () => {
            try {
                await this.delay(800);
                const lowerQuery = query.toLowerCase();

                // 1. Find ALL employees that match
                const matches = employees.filter(e =>
                    lowerQuery.includes(e.name.toLowerCase()) ||
                    lowerQuery.includes(e.nickname.toLowerCase()) ||
                    lowerQuery.includes(e.id || '') ||
                    lowerQuery.includes(e.number.toLowerCase())
                );

                const robotPrefix = user.gender === 1 ? 'אני עוזר חכם' : 'אני עוזרת חכמה';
                let finalResponse = '';

                // Case: Ambiguous matches (more than 1)
                // Case: Ambiguous matches (more than 1)
                if (matches.length > 1) {
                    finalResponse = `🤔 ${robotPrefix}. אני רואה שיש במערכת ${matches.length} עובדים עם השם הזה. כדי שאוכל לתת לך את המידע הנכון, למי מהם התכוונת?\n\n`;
                    matches.forEach(m => {
                        finalResponse += `🔹 **${m.nickname}** (מספר עובד: ${m.number})\n`;
                    });
                    finalResponse += `\nאנא ציין את **הכינוי** או **מספר העובד** הרצוי.`;
                }
                // Case: Single match
                else if (matches.length === 1) {
                    const found = matches[0];
                    if (found && found.id) {
                        const data = await this.employeeDataService.getEmployeeData(found.id);
                        if (data) {
                            const genderGreeing = user.gender === 1 ? 'שלום אדוני' : 'שלום גבירתי';
                            if (lowerQuery.includes('חופש')) {
                                finalResponse = `${genderGreeing} ${user.nickname}. ${robotPrefix} ואשמח לעזור.\n\n` +
                                    `🌴 **ימי חופשה של ${data.personalInfo.name} (${data.personalInfo.number}):**\n\n` +
                                    `• ימי חופשה שנותרו: **${data.timeOff.vacationBalance}** ימים\n` +
                                    `• ימים שנוצלו: **${data.timeOff.vacationUsed}** ימים`;
                            } else if (lowerQuery.includes('שכר') || lowerQuery.includes('משכורת')) {
                                const latest = data.salaryHistory[data.salaryHistory.length - 1];
                                finalResponse = `${genderGreeing} ${user.nickname}. ${robotPrefix}. השכר של ${data.personalInfo.name} (${data.personalInfo.number}) הוא:\n\n` +
                                    `💰 **שכר ברוטו:** **₪${latest.grossSalary.toLocaleString()}**`;
                            } else {
                                finalResponse = `✅ ${robotPrefix}. מצאתי את העובד:\n**${data.personalInfo.name}**\nמס' עובד: **${data.personalInfo.number}**\nתפקיד: **${data.personalInfo.roleName}**`;
                            }
                        } else {
                            finalResponse = `❌ ${robotPrefix}. לא הצלחתי לשלוף נתונים עבור העובד: ${found.name}`;
                        }
                    }
                }
                // Case: No direct matches, try context
                else if (chatHistory.length > 0) {
                    // Look backwards for the last employee mentioned in assistant messages
                    let foundContext: AuthorizedEmployee | undefined;
                    for (let i = chatHistory.length - 1; i >= 0; i--) {
                        const msg = chatHistory[i].message.toLowerCase();
                        // Find matches in history
                        const historyMatches = employees.filter(e =>
                            msg.includes(e.name.toLowerCase()) ||
                            msg.includes(e.nickname.toLowerCase())
                        );

                        // If we found exactly one in a previous message, assume context
                        if (historyMatches.length === 1) {
                            foundContext = historyMatches[0];
                            break;
                        }
                    }

                    if (foundContext && foundContext.id) {
                        const data = await this.employeeDataService.getEmployeeData(foundContext.id);
                        if (data) {
                            const genderGreeing = user.gender === 1 ? 'שלום אדוני' : 'שלום גבירתי';
                            if (lowerQuery.includes('חופש')) {
                                finalResponse = `${genderGreeing} ${user.nickname}. בהמשך לשיחתנו על ${foundContext.name}:\n\n` +
                                    `• ימי חופשה שנותרו: **${data.timeOff.vacationBalance}** ימים`;
                            } else if (lowerQuery.includes('שכר') || lowerQuery.includes('משכורת')) {
                                const latest = data.salaryHistory[data.salaryHistory.length - 1];
                                finalResponse = `${genderGreeing} ${user.nickname}. השכר של ${foundContext.name} הוא:\n\n` +
                                    `💰 **שכר ברוטו:** **₪${latest.grossSalary.toLocaleString()}**`;
                            } else {
                                finalResponse = `אני מבין שאתה שואל עדיין על **${foundContext.name}**. איך אוכל לעזור עוד?`;
                            }
                        }
                    } else {
                        finalResponse = `❌ ${robotPrefix}. לא נמצא עובד מתאים במערכת עבור: "${query}"\n\nאולי התכוונת לאחד מהעובדים ברשימה?`;
                    }
                } else {
                    finalResponse = `❌ ${robotPrefix}. לא נמצא עובד מתאים במערכת עבור: "${query}"\n\nאולי התכוונת לאחד מהעובדים ברשימה?`;
                }

                const words = finalResponse.split(' ');
                for (let i = 0; i < words.length; i++) {
                    if (this.abortController?.signal.aborted) break;
                    subject.next(words[i] + (i === words.length - 1 ? '' : ' '));
                    await this.delay(50 + Math.random() * 70);
                }
                subject.complete();
            } catch (err) {
                subject.complete();
            }
        })();

        return subject.asObservable();
    }

    private delay(ms: number): Promise<void> {
        return new Promise(r => setTimeout(r, ms));
    }
}
