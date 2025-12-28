import { computed, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    signalStore,
    withState,
    withComputed,
    withMethods,
    patchState
} from '@ngrx/signals';
import { ChatMessage } from '../models';
import { environment } from 'src/environments/environment';
import { CohereService } from '../core/services';

export interface AppStoreState {
    // Config
    apiKey: string;
    modelName: string;
    systemPrompt: string;
    apiUrl: string;
    tools: any[];
    documents: any[];
    mode: 'embedded' | 'popover';
    userPhoto: string;
    isDarkMode: boolean;
    inputPlaceholder: string;
    emptyChatTitle: string;
    emptyChatSubtitle: string;
    questionSuggestions: string[];
    startMessage: string;

    // Chat
    messages: ChatMessage[];
    isProcessing: boolean;
    isOpen: boolean;

    // UI
    isLoading: boolean;
    error: string | null;
}

const initialState: AppStoreState = {
    apiKey: environment.cohereApiKey,
    modelName: 'command-a-03-2025',
    systemPrompt: 'אתה עוזר משאבי אנוש',
    apiUrl: 'https://api.cohere.com/v1/chat',
    tools: [
        {
            name: "get_tax_rate",
            description: "כדי לקבל נתונים מפורטים על ענייני מס",
            handler: (params: {}) => ({ result: "המס בישראל הוא 40%" })
        },
        {
            name: "get_pension",
            description: "כדי לקבל נתונים מפורטים על ענייני פנסיה",
            handler: (params: {}) => ({ result: "בישראל מקבלים פנסיה 50 שקל ביום" })
        }
    ],
    documents: [],
    mode: 'embedded',
    userPhoto: 'https://ui-avatars.com/api/?name=User',
    isDarkMode: false,
    inputPlaceholder: 'במה ניתן לעזור?',
    emptyChatTitle: 'התחל שיחה',
    emptyChatSubtitle: 'שאל אותי משהו...',
    questionSuggestions: [],
    startMessage: 'היי! איך אפשר לעזור לך היום?',

    messages: [],
    isProcessing: false,
    isOpen: true,
    isLoading: false,
    error: null,
};

export const AppStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed((store) => ({
        isConfigured: computed(() => !!store.apiKey()),
        displayMessages: computed(() => store.messages()),
    })),

    withMethods((store) => {
        const cohereService = inject(CohereService);
        let msgSubscription: Subscription | null = null;

        // Shared Helper
        const updateTheme = (isDark: boolean) => {
            const root = document.documentElement.classList;
            isDark ? root.add('dark') : root.remove('dark');
        };

        return {
            updateConfig(config: Partial<AppStoreState>) {
                patchState(store, config);
                if (config.isDarkMode !== undefined) updateTheme(config.isDarkMode);
            },

            setIsDarkMode(isDark: boolean) {
                patchState(store, { isDarkMode: isDark });
                updateTheme(isDark);
            },

            toggleTheme() {
                const isDark = !store.isDarkMode();
                patchState(store, { isDarkMode: isDark });
                updateTheme(isDark);
            },

            toggleChat: () => patchState(store, { isOpen: !store.isOpen() }),
            setIsOpen: (isOpen: boolean) => patchState(store, { isOpen }),

            addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
                const msg = { ...message, id: crypto.randomUUID(), timestamp: new Date() };
                patchState(store, { messages: [...store.messages(), msg] });
                return msg.id;
            },

            updateMessage(id: string, updates: Partial<ChatMessage>) {
                patchState(store, {
                    messages: store.messages().map(m => m.id === id ? { ...m, ...updates } : m)
                });
            },

            clearChat: () => patchState(store, { messages: [] }),
            stopRequest() {
                msgSubscription?.unsubscribe();
                cohereService.stopStream();
                patchState(store, { isProcessing: false });
            },

            async processMessage(content: string) {
                if (!content.trim() || store.isProcessing()) return;
                patchState(store, { isProcessing: true });

                const now = new Date();
                const userMsg: ChatMessage = { type: 'user', content, id: crypto.randomUUID(), timestamp: now };
                const assistantMsg: ChatMessage = { type: 'assistant', content: '', id: crypto.randomUUID(), timestamp: now, isTyping: true };

                // Update State: Add User & Temp Assistant Message
                patchState(store, { messages: [...store.messages(), userMsg, assistantMsg] });

                const config = {
                    apiKey: store.apiKey(),
                    modelName: store.modelName(),
                    systemPrompt: store.systemPrompt(),
                    apiUrl: store.apiUrl(),
                    tools: store.tools(),
                    documents: store.documents(),
                };

                const chatHistory = store.messages().slice(0, -2).map(m => ({
                    role: m.type === 'user' ? 'USER' : 'CHATBOT',
                    message: m.content
                }));

                msgSubscription = cohereService.generateResponse(config, content, chatHistory).subscribe({
                    next: (chunk) => {
                        const messages = store.messages();
                        const idx = messages.findIndex(m => m.id === assistantMsg.id);
                        if (idx !== -1) {
                            const updated = [...messages];
                            updated[idx] = { ...updated[idx], content: updated[idx].content + chunk, isTyping: false };
                            patchState(store, { messages: updated });
                        }
                    },
                    error: (err) => {
                        console.error('Chat Error:', err);
                        const messages = store.messages();
                        const idx = messages.findIndex(m => m.id === assistantMsg.id);
                        if (idx !== -1) {
                            const updated = [...messages];
                            updated[idx] = { ...updated[idx], content: updated[idx].content + '\n[Error]', isTyping: false };
                            patchState(store, { messages: updated, isProcessing: false });
                        }
                    },
                    complete: () => patchState(store, { isProcessing: false })
                });
            },

            initialize() {
                if (store.isDarkMode()) updateTheme(true);
                if (store.startMessage() && store.messages().length === 0) {
                    const startMsg = { type: 'assistant', content: store.startMessage(), id: crypto.randomUUID(), timestamp: new Date() } as ChatMessage;
                    patchState(store, { messages: [startMsg] });
                }
            }
        };
    })
);
