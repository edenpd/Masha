import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable, Subject } from 'rxjs';
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
    generateResponse(query: string, employees: AuthorizedEmployee[], user: AuthUser): Observable<string> {
        const responseSubject = new Subject<string>();

        // Initialize new controller for this request
        this.stopStream();
        this.abortController = new AbortController();

        if (!this.apiKey || this.apiKey === 'YOUR_COHERE_API_KEY') {
            return this.generateMockResponse(query, employees, user);
        }

        this.streamResponseWithTools(query, employees, responseSubject, user);
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
1. אם נשאלת שאלה על עובד ספציפי, השתמש בכלי "get_employee_detailed_data" כדי לקבל את כל המידע שלו (שכר, חופשה וכו').
2. אל תנחש נתונים שאינם ברשימה לעיל ללא שימוש בכלי.
3. ענה תמיד בעברית מקצועית ואדיבה. השתמש במגדר הנכון לפי פרטי המשתמש/ת.
4. השתמש ב-Markdown לעיצוב התשובה.`;
    }

    /**
     * Format full employee data for AI consumption
     */
    private formatEmployeeForAI(e: EmployeeData): any {
        const latestSalary = e.salaryHistory[e.salaryHistory.length - 1];
        return {
            name: e.personalInfo.name,
            id: e.id,
            role: e.personalInfo.roleName,
            department: e.personalInfo.departmentName,
            manager: e.personalInfo.manager,
            startDate: e.personalInfo.startDate,
            vacationBalance: e.timeOff.vacationBalance,
            sickLeaveBalance: e.timeOff.sickLeaveBalance,
            lastGrossSalary: latestSalary.grossSalary,
            lastNetSalary: latestSalary.netSalary,
            performanceRating: e.performanceRating
        };
    }

    private generateMockResponse(query: string, employees: AuthorizedEmployee[], user: AuthUser): Observable<string> {
        const subject = new Subject<string>();

        (async () => {
            try {
                await this.delay(800);
                const lowerQuery = query.toLowerCase();

                const found = employees.find(e =>
                    lowerQuery.includes(e.name.toLowerCase()) ||
                    lowerQuery.includes(e.nickname.toLowerCase()) ||
                    lowerQuery.includes(e.id || '') ||
                    lowerQuery.includes(e.number.toLowerCase())
                );

                const robotPrefix = user.gender === 1 ? 'אני עוזר חכם' : 'אני עוזרת חכמה';
                let finalResponse = '';
                if (found && found.id) {
                    // In mock mode, we "simulate" fetching by calling the real service
                    const data = await this.employeeDataService.getEmployeeData(found.id);
                    if (data) {
                        const genderGreeing = user.gender === 1 ? 'שלום אדוני' : 'שלום גבירתי';
                        if (lowerQuery.includes('חופש')) {
                            finalResponse = `${genderGreeing} ${user.nickname}. ${robotPrefix} ואשמח לעזור.\n\n` +
                                `🌴 **ימי חופשה של ${data.personalInfo.name}:**\n\n` +
                                `• ימי חופשה שנותרו: **${data.timeOff.vacationBalance}** ימים\n` +
                                `• ימים שנוצלו: **${data.timeOff.vacationUsed}** ימים`;
                        } else if (lowerQuery.includes('שכר') || lowerQuery.includes('משכורת')) {
                            const latest = data.salaryHistory[data.salaryHistory.length - 1];
                            finalResponse = `${genderGreeing} ${user.nickname}. ${robotPrefix}. השכר של ${data.personalInfo.name} הוא:\n\n` +
                                `💰 **שכר ברוטו:** **₪${latest.grossSalary.toLocaleString()}**`;
                        } else {
                            finalResponse = `✅ ${robotPrefix}. מצאתי את העובד:\n**${data.personalInfo.name}** (מספר עובד: **${data.id}**)`;
                        }
                    } else {
                        finalResponse = `❌ ${robotPrefix}. לא הצלחתי לשלוף נתונים עבור העובד: ${found.name}`;
                    }
                } else {
                    finalResponse = `❌ ${robotPrefix}. לא נמצא עובד מתאים במערכת עבור: "${query}"`;
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
