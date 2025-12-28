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
import { CohereService } from '../core/services/cohere.service';

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
    modelName: 'command-r-08-2024',
    systemPrompt: 'אתה עוזר משאבי אנוש',
    apiUrl: 'https://api.cohere.com/v2/chat',
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
    mode: 'popover',
    userPhoto: 'https://ui-avatars.com/api/?name=User',
    isDarkMode: false,
    inputPlaceholder: 'במה ניתן לעזור?',
    emptyChatTitle: 'התחל שיחה',
    emptyChatSubtitle: 'שאל אותי משהו...',
    questionSuggestions: [],
    startMessage: 'היי! איך אפשר לעזור לך היום?',

    messages: [],
    isProcessing: false,
    isOpen: false,
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
                if (msgSubscription) {
                    msgSubscription.unsubscribe();
                    msgSubscription = null;
                }
                cohereService.stopStream();

                // Mark the last message as stopped by user
                const messages = store.messages();
                const lastIdx = messages.length - 1;
                if (lastIdx >= 0 && messages[lastIdx].type === 'assistant') {
                    const updated = [...messages];
                    updated[lastIdx] = {
                        ...updated[lastIdx],
                        content: updated[lastIdx].content + '\n*(הופסק על ידי המשתמש)*',
                        isTyping: false
                    };
                    patchState(store, { messages: updated });
                }

                patchState(store, { isProcessing: false });
            },

            async processMessage(content: string) {
                if (!content.trim() || store.isProcessing()) return;
                patchState(store, { isProcessing: true });

                const now = new Date();
                const userMsg: ChatMessage = { type: 'user', content, id: crypto.randomUUID(), timestamp: now };
                const assistantMsgId = crypto.randomUUID();
                const assistantMsg: ChatMessage = { type: 'assistant', content: '', id: assistantMsgId, timestamp: now, isTyping: true };

                patchState(store, { messages: [...store.messages(), userMsg, assistantMsg] });

                const config = {
                    apiKey: store.apiKey(),
                    modelName: store.modelName(),
                    systemPrompt: store.systemPrompt(),
                    apiUrl: store.apiUrl(),
                    tools: store.tools(),
                    documents: store.documents(),
                };

                const messages = [
                    { role: 'system', content: store.systemPrompt() },
                    ...store.messages().slice(0, -2).map(m => ({
                        role: m.type,
                        content: m.content
                    })),
                    { role: 'user', content }
                ];

                console.log('[AppStore] Starting request to Cohere');
                msgSubscription = cohereService.generateResponse(config, messages).subscribe({
                    next: (chunk: string) => {
                        console.log('[AppStore] Chunk:', chunk);
                        patchState(store, (state) => {
                            const msgs = [...state.messages];
                            const last = msgs[msgs.length - 1];
                            if (last && last.id === assistantMsgId) {
                                msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
                                return { messages: msgs };
                            }
                            return state;
                        });
                    },
                    error: (err: any) => {
                        // Ignore AbortError as it's handled by stopRequest
                        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort')) {
                            return;
                        }
                        console.error('Chat Error:', err);
                        patchState(store, (state) => ({
                            isProcessing: false,
                            messages: state.messages.map(m =>
                                m.id === assistantMsgId ? { ...m, content: m.content + '\n[Error]', isTyping: false } : m
                            )
                        }));
                    },
                    complete: () => {
                        patchState(store, (state) => ({
                            isProcessing: false,
                            messages: state.messages.map(m =>
                                m.id === assistantMsgId ? { ...m, isTyping: false } : m
                            )
                        }));
                    }
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
