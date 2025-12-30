import { computed, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    signalStore,
    withState,
    withComputed,
    withMethods,
    patchState
} from '@ngrx/signals';
import {
    AppState,
    AuthUser,
    AuthorizedEmployee,
    ChatMessage,
    LoadingStep
} from '../models';
import {
    DataService
} from '../core/services';
import { AiChatStore } from 'ngx-gen-ai-chat';

/**
 * Application State Interface
 */
interface AppStoreState {
    // Authentication
    currentUser: AuthUser | null;

    // Employees
    authorizedEmployees: AuthorizedEmployee[];

    // Chat
    messages: ChatMessage[];
    isProcessing: boolean;

    // App State
    appState: AppState;
    loadingSteps: LoadingStep[];
    currentLoadingStep: number;
    error: string | null;
    theme: 'light' | 'dark';
    startMessage: string;
}

/**
 * Initial State
 */
const initialState: AppStoreState = {
    currentUser: null,
    authorizedEmployees: [],
    messages: [],
    isProcessing: false,
    appState: 'initializing',
    loadingSteps: [
        { id: 'user', text: 'מזהה משתמש...', completed: false, icon: '👤' },
        { id: 'employees', text: 'טוען רשימת עובדים מורשים...', completed: false, icon: '👥' },
    ],
    currentLoadingStep: 0,
    error: null,
    theme: 'light',
    startMessage: 'היי! איך אפשר לעזור לך היום?',
};

/**
 * Main Application SignalStore
 */
export const AppStore = signalStore(
    { providedIn: 'root' },

    withState(initialState),

    withComputed((store) => ({
        // Check if app is ready for chat
        isReady: computed(() => store.appState() === 'ready'),

        // Check if currently loading
        isLoading: computed(() =>
            ['initializing', 'authenticating', 'loading-data'].includes(store.appState())
        ),

        // Get visible loading steps
        visibleLoadingSteps: computed(() => store.loadingSteps()),

        // Current loading message
        currentLoadingMessage: computed(() => {
            const currentStep = store.loadingSteps().find(s => !s.completed);
            return currentStep?.text ?? 'טוען...';
        }),

        // Get employee count
        employeeCount: computed(() => store.authorizedEmployees().length),

        // Get message count
        messageCount: computed(() => store.messages().length),

        // Check if there's an active typing indicator
        hasTypingIndicator: computed(() =>
            store.messages().some(m => m.isTyping)
        ),
    })),

    withComputed((store) => ({
        suggestedQuestions: computed(() => {
            const employees = store.authorizedEmployees();
            if (employees.length === 0) return [];

            const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
            const questions: string[] = [];

            // Generate diverse questions
            if (employees.length > 0) {
                // 1. Vacation
                const emp1 = getRandom(employees);
                questions.push(`כמה ימי חופש יש ל${emp1.name}?`);

                // 2. Salary
                const emp2 = getRandom(employees);
                questions.push(`מה המשכורת של ${emp2.name}?`);

                // 3. Role/Dept - Gender aware
                const emp3 = getRandom(employees);
                const verbWork = emp3.gender === 2 ? 'עובדת' : 'עובד';
                questions.push(`באיזה מחלקה ${verbWork} ${emp3.name}?`);

                // 4. Manager
                const emp4 = getRandom(employees);
                questions.push(`מי המנהל של ${emp4.name}?`);

                // 5. Seniority - Gender aware
                const emp5 = getRandom(employees);
                const verbStart = emp5.gender === 2 ? 'התחילה' : 'התחיל';
                questions.push(`מתי ${verbStart} ${emp5.name} לעבוד?`);
            }

            // Ensure unique
            return [...new Set(questions)].slice(0, 4);
        })
    })),

    withMethods((store) => {
        // Inject services
        const dataService = inject(DataService);
        const aiChatStore = inject(AiChatStore);

        // Helper to update loading step
        // const updateLoadingStep = (stepIndex: number, completed: boolean = true) => {
        //     const steps = [...store.loadingSteps()];
        //     if (steps[stepIndex]) {
        //         steps[stepIndex] = { ...steps[stepIndex], completed };
        //     }
        //     patchState(store, {
        //         loadingSteps: steps,
        //         currentLoadingStep: stepIndex
        //     });
        // };

        // // Helper to add message
        // const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        //     const newMessage: ChatMessage = {
        //         ...message,
        //         id: crypto.randomUUID(),
        //         timestamp: new Date(),
        //     };
        //     patchState(store, {
        //         messages: [...store.messages(), newMessage]
        //     });
        //     return newMessage.id;
        // };

        // // Helper to update message
        // const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
        //     const messages = store.messages().map(m =>
        //         m.id === id ? { ...m, ...updates } : m
        //     );
        //     patchState(store, { messages });
        // };

        // // Helper to remove typing indicator
        // const removeTypingIndicator = () => {
        //     const messages = store.messages().filter(m => !m.isTyping);
        //     patchState(store, { messages });
        // };

        // let msgSubscription: Subscription | null = null;

        return {
            /**
             * Initialize the application
             * Fetches combined data in one call
             */
            async initialize() {
                // Initialize theme
                document.documentElement.classList.toggle('dark', store.theme() === 'dark');

                try {
                    patchState(store, { appState: 'loading-data' });

                    // Step 1: Get User Details (Fast)
                    const userData = await dataService.getCurrentUser();
                    const theme = userData.isDarkMode ? 'dark' : 'light';

                    patchState(store, {
                        currentUser: userData,
                        theme: theme,
                        currentLoadingStep: 1,
                        loadingSteps: store.loadingSteps().map(s => s.id === 'user' ? { ...s, completed: true } : s)
                    });

                    // Update document class immediately so loading screen adapts
                    document.documentElement.classList.toggle('dark', theme === 'dark');

                    // Step 2: Get Authorized Employees (Slower)
                    const employees = await dataService.getAuthorizedEmployees();

                    patchState(store, {
                        authorizedEmployees: employees,
                        currentLoadingStep: 2,
                        loadingSteps: store.loadingSteps().map(s => s.id === 'employees' ? { ...s, completed: true } : s)
                    });

                    // Small delay for smooth transition
                    await delay(500);

                    const user = store.currentUser()!;

                    // Generate list of example questions from the computed property
                    // Accessing computed property in method logic needs to be done carefully or just re-derived if strictly needed,
                    // but here we can just use the store state directly as we just updated it.
                    // Actually, computed signals are available on the store object.
                    const questions = store.suggestedQuestions().slice(0, 3).map(q => `• "${q}"`).join('\n');

                    patchState(store, {
                        appState: 'ready',
                        startMessage: `שלום ${user.firstName}! 👋\n\nאני העוזרת החכמה שלך לניהול משאבי אנוש. אני כאן כדי לעזור לך עם נתוני ה${user.departmentName}.\n\nיש לי גישה לנתונים של **${store.authorizedEmployees().length}** עובדים מורשים.\n\nתוכל/י לשאול אותי שאלות כמו:\n${questions}\n\n🔒 כל המידע מאובטח ומוצג רק למורשים.`,

                    });

                } catch (error) {
                    patchState(store, {
                        appState: 'error',
                        error: 'שגיאה באתחול המערכת. נסה לרענן את הדף.'
                    });
                }
            },

            getSystemPrompt(): string {
                const employeeList = store.authorizedEmployees().map(e =>
                    `- שם: ${e.name}, כינוי: ${e.nickname}, מזהה: ${e.id || e.number}, מחלקה: ${e.departmentName}, תפקיד: ${e.roleName}, מגדר: ${e.gender === 1 ? 'זכר' : 'נקבה'}`
                ).join('\n');

                const genderInstruction = store.currentUser()!.gender === 1
                    ? "פנה למשתמש בלשון זכר."
                    : "פנה למשתמשת בלשון נקבה.";

                return `אתה עוזר HR חכם בשם "HR Insight". 
לפניך רשימה של עובדים מורשים. 

המשתמש המחובר: ${store.currentUser()!.firstName} ${store.currentUser()!.lastName} (כינוי: ${store.currentUser()!.nickname}), מגדר: ${store.currentUser()!.gender === 1 ? 'זכר' : 'נקבה'}.
${genderInstruction}

רשימת עובדים:
${employeeList}

הנחיות:
1. אם נשאלת שאלה על עובד ספציפי, השתמש בכלי "get_employee_detailed_data" כדי לקבל את כל המידע שלו.
2. אל תנחש נתונים שאינם ברשימה לעיל.
3. ענה תמיד בעברית בלבד. אל תשתמש במונחים טכניים באנגלית (כמו JSON field names).
4. הצג את התשובה בצורה אנושית ונעימה ב-Markdown.
5. חשוב: אם ישנם מספר עובדים עם אותו השם, היה אדיב ובקש מהמשתמש להבהיר למי הוא מתכוון. הצג לו רשימה של האפשרויות עם הכינוי ומספר העובד של כל אחד.
6. אל תמציא נתונים, אם אין לך את המידע המתאים, תגיד לו כך`;
            },

            getTools(): any[] {
                return [
                    {
                        name: "get_employee_detailed_data",
                        description: "מתקשר למערכת ה-HR כדי לקבל נתונים מפורטים (שכר, חופשות, ביצועים) עבור עובד ספציפי לפי מזהה.",
                        parameters: {
                            type: "object",
                            properties: {
                                employee_id: {
                                    description: "המזהה הייחודי (ID) של העובד",
                                    type: "string",
                                }
                            },
                            required: ["employee_id"]
                        },
                        handler: async (employee: any) => {
                            return await dataService.getEmployeeData(employee);
                        }
                    }
                ];
            },

            /**
             * Process a user message and generate AI response
             */
            async processMessage(userInput: string) {
                // if (!userInput.trim() || store.isProcessing()) return;

                // patchState(store, { isProcessing: true });

                // // Add user message
                // addMessage({
                //     type: 'user',
                //     content: userInput,
                // });

                // // Add typing indicator
                // const typingId = addMessage({
                //     type: 'assistant',
                //     content: '',
                //     isTyping: true,
                // });

                // try {
                //     const employees = store.authorizedEmployees();
                //     const user = store.currentUser();

                //     if (!user) throw new Error('No user found');

                //     // Prepare chat history (exclude current message and typing indicators)
                //     const rawMessages = store.messages().filter(m => !m.isTyping);
                //     // The last message is the current user input we just added, so exclude it from history
                //     const historyMessages = rawMessages.slice(0, -1);

                //     const chatHistory = historyMessages.map(m => ({
                //         role: m.type === 'user' ? 'USER' : 'CHATBOT',
                //         message: m.content
                //     }));

                //     // Step A: Generate AI response as a stream
                //     msgSubscription = cohereService.generateResponse(userInput, employees, user, chatHistory).subscribe({
                //         next: (chunk) => {
                //             // If this is the first chunk, remove typing indicator
                //             if (store.hasTypingIndicator()) {
                //                 removeTypingIndicator();
                //                 addMessage({
                //                     type: 'assistant',
                //                     content: chunk,
                //                 });
                //             } else {
                //                 // Append to the last assistant message
                //                 const messages = store.messages();
                //                 const lastAssistantMsg = [...messages].reverse().find(m => m.type === 'assistant');
                //                 if (lastAssistantMsg) {
                //                     updateMessage(lastAssistantMsg.id, {
                //                         content: lastAssistantMsg.content + chunk
                //                     });
                //                 }
                //             }
                //         },
                //         error: (err) => {
                //             console.error('Streaming error:', err);
                //             removeTypingIndicator();
                //             addMessage({
                //                 type: 'assistant',
                //                 content: '❌ אירעה שגיאה בקבלת המידע.',
                //             });
                //             patchState(store, { isProcessing: false });
                //         },
                //         complete: () => {
                //             patchState(store, { isProcessing: false });
                //         }
                //     });

                // } catch (error) {
                //     console.error('Processing error:', error);
                //     removeTypingIndicator();
                //     addMessage({
                //         type: 'assistant',
                //         content: '❌ אירעה שגיאה בעיבוד הבקשה. נסה שוב.',
                //     });
                //     patchState(store, { isProcessing: false });
                // }
            },

            /**
             * Stop current AI generation
             */
            stopRequest() {
                // if (msgSubscription) {
                //     msgSubscription.unsubscribe();
                //     msgSubscription = null;
                // }
                // cohereService.stopStream();
                // removeTypingIndicator();

                // // Add a visual indicator that it was stopped if there's an unfinished message
                // const messages = store.messages();
                // const lastMsg = messages[messages.length - 1];
                // if (lastMsg && lastMsg.type === 'assistant' && !lastMsg.isTyping) {
                //     updateMessage(lastMsg.id, {
                //         content: lastMsg.content + ' [הופסק על ידי המשתמש]'
                //     });
                // }

                // patchState(store, { isProcessing: false });
            },

            /**
             * Clear chat history
             */
            clearChat(customMessage?: string) {
                const user = store.currentUser();
                const employees = store.authorizedEmployees();

                let message: string | undefined = customMessage;

                if (!message && user) {
                    message = `השיחה נוקתה. כיצד אוכל לעזור לך?\n\nיש לי גישה לנתונים של ${employees.length} עובדים מורשים.`;
                }

                aiChatStore.clearChat(message);
            },

            /**
             * Get employee by ID
             */
            getEmployee(id: string): AuthorizedEmployee | undefined {
                return store.authorizedEmployees().find(e => e.id === id);
            },

            /**
             * Toggle between light and dark themes
             */
            toggleTheme() {
                const newTheme = store.theme() === 'light' ? 'dark' : 'light';
                patchState(store, { theme: newTheme });

                // Update DOM for Tailwind class strategy
                document.documentElement.classList.toggle('dark', newTheme === 'dark');
            },
        };
    })
);

// Helper delay function
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
