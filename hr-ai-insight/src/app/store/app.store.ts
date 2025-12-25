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
    EmployeeData,
    ChatMessage,
    LoadingStep
} from '../models';
import {
    AuthService,
    EmployeeLookupService,
    EmployeeDataService,
    CohereService
} from '../core/services';

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
        { id: 'auth', text: 'מאמת זהות משתמש...', completed: false, icon: '🔐' },
        { id: 'connect', text: 'מתחבר למערכות הארגון...', completed: false, icon: '🔌' },
        { id: 'employees', text: 'טוען נתוני עובדים מורשים...', completed: false, icon: '👥' },
        { id: 'neural', text: 'מאתחל רשת נוירונים...', completed: false, icon: '🧠' },
        { id: 'ready', text: 'מכין ממשק שיחה...', completed: false, icon: '💬' },
    ],
    currentLoadingStep: 0,
    error: null,
    theme: 'dark',
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

        // Get visible loading steps (completed + current)
        visibleLoadingSteps: computed(() => {
            const steps = store.loadingSteps();
            const current = store.currentLoadingStep();
            return steps.slice(0, current + 1);
        }),

        // Current loading message
        currentLoadingMessage: computed(() => {
            const steps = store.loadingSteps();
            const current = store.currentLoadingStep();
            return steps[current]?.text ?? 'טוען...';
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

    withMethods((store) => {
        // Inject services
        const authService = inject(AuthService);
        const employeeLookup = inject(EmployeeLookupService);
        const employeeData = inject(EmployeeDataService);
        const cohereService = inject(CohereService);

        // Helper to update loading step
        const updateLoadingStep = (stepIndex: number, completed: boolean = true) => {
            const steps = [...store.loadingSteps()];
            if (steps[stepIndex]) {
                steps[stepIndex] = { ...steps[stepIndex], completed };
            }
            patchState(store, {
                loadingSteps: steps,
                currentLoadingStep: stepIndex
            });
        };

        // Helper to add message
        const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
            const newMessage: ChatMessage = {
                ...message,
                id: crypto.randomUUID(),
                timestamp: new Date(),
            };
            patchState(store, {
                messages: [...store.messages(), newMessage]
            });
            return newMessage.id;
        };

        // Helper to update message
        const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
            const messages = store.messages().map(m =>
                m.id === id ? { ...m, ...updates } : m
            );
            patchState(store, { messages });
        };

        // Helper to remove typing indicator
        const removeTypingIndicator = () => {
            const messages = store.messages().filter(m => !m.isTyping);
            patchState(store, { messages });
        };

        let msgSubscription: Subscription | null = null;

        return {
            /**
             * Initialize the application
             * Handles auth and data loading with animated steps
             */
            async initialize() {
                // Initialize theme
                if (store.theme() === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }

                try {
                    // Step 1: Authentication
                    patchState(store, { appState: 'authenticating' });
                    updateLoadingStep(0, false);

                    await delay(500);
                    const user = await authService.authenticate();
                    patchState(store, { currentUser: user });
                    updateLoadingStep(0, true);

                    // Step 2: Connect to systems (simulated)
                    updateLoadingStep(1, false);
                    await delay(600);
                    updateLoadingStep(1, true);

                    // Step 3: Load employees
                    patchState(store, { appState: 'loading-data' });
                    updateLoadingStep(2, false);

                    const employees = await employeeLookup.getAuthorizedEmployees();
                    patchState(store, {
                        authorizedEmployees: employees,
                    });
                    updateLoadingStep(2, true);

                    // Step 4: Initialize neural network (simulated)
                    updateLoadingStep(3, false);
                    await delay(800);
                    updateLoadingStep(3, true);

                    // Step 5: Prepare chat interface
                    updateLoadingStep(4, false);
                    await delay(400);
                    updateLoadingStep(4, true);

                    // Final transition
                    await delay(300);

                    // Add welcome message
                    addMessage({
                        type: 'assistant',
                        content: `שלום ${user.name}! 👋\n\nאני העוזר החכם שלך לניהול משאבי אנוש. יש לי גישה לנתונים של **${employees.length}** עובדים מורשים.\n\nתוכל/י לשאול אותי שאלות כמו:\n• "כמה ימי חופש נשארו לדני?"\n• "מה המשכורת של שרה?"\n• "באיזה מחלקה עובד יוסי?"\n\n🔒 כל המידע מאובטח ומוצג רק למורשים.`,
                    });

                    patchState(store, { appState: 'ready' });

                } catch (error) {
                    patchState(store, {
                        appState: 'error',
                        error: 'שגיאה באתחול המערכת. נסה לרענן את הדף.'
                    });
                }
            },

            /**
             * Process a user message and generate AI response
             */
            async processMessage(userInput: string) {
                if (!userInput.trim() || store.isProcessing()) return;

                patchState(store, { isProcessing: true });

                // Add user message
                addMessage({
                    type: 'user',
                    content: userInput,
                });

                // Add typing indicator
                const typingId = addMessage({
                    type: 'assistant',
                    content: '',
                    isTyping: true,
                });

                try {
                    const employees = store.authorizedEmployees();

                    // Step A: Generate AI response as a stream
                    msgSubscription = cohereService.generateResponse(userInput, employees).subscribe({
                        next: (chunk) => {
                            // If this is the first chunk, remove typing indicator
                            if (store.hasTypingIndicator()) {
                                removeTypingIndicator();
                                addMessage({
                                    type: 'assistant',
                                    content: chunk,
                                });
                            } else {
                                // Append to the last assistant message
                                const messages = store.messages();
                                const lastAssistantMsg = [...messages].reverse().find(m => m.type === 'assistant');
                                if (lastAssistantMsg) {
                                    updateMessage(lastAssistantMsg.id, {
                                        content: lastAssistantMsg.content + chunk
                                    });
                                }
                            }
                        },
                        error: (err) => {
                            console.error('Streaming error:', err);
                            removeTypingIndicator();
                            addMessage({
                                type: 'assistant',
                                content: '❌ אירעה שגיאה בקבלת המידע.',
                            });
                            patchState(store, { isProcessing: false });
                        },
                        complete: () => {
                            patchState(store, { isProcessing: false });
                        }
                    });

                } catch (error) {
                    console.error('Processing error:', error);
                    removeTypingIndicator();
                    addMessage({
                        type: 'assistant',
                        content: '❌ אירעה שגיאה בעיבוד הבקשה. נסה שוב.',
                    });
                    patchState(store, { isProcessing: false });
                }
            },

            /**
             * Stop current AI generation
             */
            stopRequest() {
                if (msgSubscription) {
                    msgSubscription.unsubscribe();
                    msgSubscription = null;
                }
                cohereService.stopStream();
                removeTypingIndicator();

                // Add a visual indicator that it was stopped if there's an unfinished message
                const messages = store.messages();
                const lastMsg = messages[messages.length - 1];
                if (lastMsg && lastMsg.type === 'assistant' && !lastMsg.isTyping) {
                    updateMessage(lastMsg.id, {
                        content: lastMsg.content + ' [הופסק על ידי המשתמש]'
                    });
                }

                patchState(store, { isProcessing: false });
            },

            /**
             * Clear chat history
             */
            clearChat() {
                patchState(store, { messages: [] });

                // Re-add welcome message
                const user = store.currentUser();
                const employees = store.authorizedEmployees();

                if (user) {
                    addMessage({
                        type: 'assistant',
                        content: `השיחה נוקתה. כיצד אוכל לעזור לך, ${user.name}?\n\nיש לי גישה לנתונים של ${employees.length} עובדים מורשים.`,
                    });
                }
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
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
        };
    })
);

// Helper delay function
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
