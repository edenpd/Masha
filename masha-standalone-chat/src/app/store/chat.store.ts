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
    AuthUser,
    AuthorizedEmployee,
    ChatMessage,
    MashaChatConfig
} from '../models';
import { CohereService } from '../services/cohere.service';

/**
 * Chat Store State Interface
 */
interface ChatStoreState {
    // Configuration
    config: MashaChatConfig | null;

    // User & Employees
    currentUser: AuthUser | null;
    authorizedEmployees: AuthorizedEmployee[];

    // Chat
    messages: ChatMessage[];
    isProcessing: boolean;

    // UI State
    isPopoverOpen: boolean;
    theme: 'light' | 'dark';
}

/**
 * Initial State
 */
const initialState: ChatStoreState = {
    config: null,
    currentUser: null,
    authorizedEmployees: [],
    messages: [],
    isProcessing: false,
    isPopoverOpen: false,
    theme: 'light',
};

/**
 * Chat SignalStore
 * This is the main state management for the standalone chat component
 */
export const ChatStore = signalStore(
    { providedIn: 'root' },

    withState(initialState),

    withComputed((store) => ({
        // Check if chat is configured and ready
        isReady: computed(() => store.config() !== null),

        // Get message count
        messageCount: computed(() => store.messages().length),

        // Check if there's an active typing indicator
        hasTypingIndicator: computed(() =>
            store.messages().some(m => m.isTyping)
        ),

        // Suggested questions based on employees
        suggestedQuestions: computed(() => {
            const employees = store.authorizedEmployees();
            if (employees.length === 0) return [
                'כמה ימי חופש נשארו לי?',
                'מה המשכורת שלי?',
                'מי המנהל שלי?'
            ];

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
            }

            // Ensure unique
            return [...new Set(questions)].slice(0, 4);
        })
    })),

    withMethods((store) => {
        // Inject services
        const cohereService = inject(CohereService);

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
             * Initialize the chat with configuration
             */
            initialize(config: MashaChatConfig) {
                // Configure Cohere service
                cohereService.configure(config.apiKey, config.modelName);

                // Set theme
                const theme = config.currentUser?.isDarkMode ? 'dark' : 'light';

                patchState(store, {
                    config,
                    currentUser: config.currentUser || null,
                    authorizedEmployees: config.authorizedEmployees || [],
                    theme
                });

                // Update DOM for theme
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }

                // Add welcome message if user is provided
                if (config.currentUser) {
                    const user = config.currentUser;
                    const welcomeMsg = user.gender === 1
                        ? `שלום ${user.firstName}! 👋\n\nאני העוזר החכם שלך לניהול משאבי אנוש. אני כאן כדי לעזור לך עם נתוני ה${user.departmentName}.`
                        : `שלום ${user.firstName}! 👋\n\nאני העוזרת החכמה שלך לניהול משאבי אנוש. אני כאן כדי לעזור לך עם נתוני ה${user.departmentName}.`;

                    const questions = store.suggestedQuestions().slice(0, 3).map(q => `• "${q}"`).join('\n');

                    addMessage({
                        type: 'assistant',
                        content: `${welcomeMsg}\n\nיש לי גישה לנתונים של **${store.authorizedEmployees().length}** עובדים מורשים.\n\nתוכל/י לשאול אותי שאלות כמו:\n${questions}\n\n🔒 כל המידע מאובטח ומוצג רק למורשים.`,
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
                    const user = store.currentUser();

                    if (!user) throw new Error('No user found');

                    // Prepare chat history (exclude current message and typing indicators)
                    const rawMessages = store.messages().filter(m => !m.isTyping);
                    const historyMessages = rawMessages.slice(0, -1);

                    const chatHistory = historyMessages.map(m => ({
                        role: m.type === 'user' ? 'USER' : 'CHATBOT',
                        message: m.content
                    }));

                    // Generate AI response as a stream
                    msgSubscription = cohereService.generateResponse(userInput, employees, user, chatHistory).subscribe({
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
                    const helpPrefix = user.gender === 1 ? 'כיצד אוכל לעזור לך' : 'כיצד אוכל לעזור לך';
                    addMessage({
                        type: 'assistant',
                        content: `השיחה נוקתה. ${helpPrefix}, ${user.nickname}?\n\nיש לי גישה לנתונים של ${employees.length} עובדים מורשים.`,
                    });
                }
            },

            /**
             * Toggle popover state
             */
            togglePopover() {
                patchState(store, { isPopoverOpen: !store.isPopoverOpen() });
            },

            /**
             * Toggle between light and dark themes
             */
            toggleTheme() {
                const newTheme = store.theme() === 'light' ? 'dark' : 'light';
                patchState(store, { theme: newTheme });

                // Update DOM
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },
        };
    })
);
