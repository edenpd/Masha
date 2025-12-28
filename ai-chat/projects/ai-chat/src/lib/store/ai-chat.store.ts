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
import { CohereService } from '../services/cohere.service';

export interface AiChatConfig {
    systemPrompt: string;
    apiKey?: string;
    modelName?: string;
    apiUrl?: string;
    tools?: any[];
    documents?: any[];
    mode?: 'embedded' | 'popover';
    userPhoto?: string;
    isDarkMode?: boolean;
    inputPlaceholder?: string;
    emptyChatTitle?: string;
    emptyChatSubtitle?: string;
    questionSuggestions?: string[];
    startMessage?: string;
    title?: string;
}

export interface AiChatState extends Required<AiChatConfig> {
    // Chat
    messages: ChatMessage[];
    isProcessing: boolean;
    isOpen: boolean;

    // UI
    isLoading: boolean;
    error: string | null;
}

const initialState: AiChatState = {
    apiKey: '',
    modelName: 'command-r-08-2024',
    systemPrompt: '', // Required by user, so we expect it to be provided
    apiUrl: 'https://api.cohere.com/v2/chat',
    tools: [],
    documents: [],
    mode: 'embedded',
    userPhoto: 'https://ui-avatars.com/api/?name=User',
    isDarkMode: false,
    inputPlaceholder: 'במה ניתן לעזור?',
    emptyChatTitle: 'התחל שיחה',
    emptyChatSubtitle: 'שאל אותי משהו...',
    questionSuggestions: [],
    startMessage: 'היי! איך אפשר לעזור לך היום?',
    title: 'AI Chat',

    messages: [],
    isProcessing: false,
    isOpen: false,
    isLoading: false,
    error: null,
};

export const AiChatStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),

    withComputed((store) => ({
        isConfigured: computed(() => !!store.apiKey()),
        displayMessages: computed(() => store.messages()),
    })),

    withMethods((store) => {
        const cohereService = inject(CohereService);
        let msgSubscription: Subscription | null = null;

        const updateTheme = (isDark: boolean) => {
            const root = document.documentElement.classList;
            isDark ? root.add('dark') : root.remove('dark');
        };

        const updateAssistantMsg = (id: string, update: Partial<ChatMessage>) => {
            patchState(store, (state) => ({
                messages: state.messages.map(m => m.id === id ? { ...m, ...update } : m)
            }));
        };

        const appendToAssistantMsg = (id: string, chunk: string) => {
            patchState(store, (state) => ({
                messages: state.messages.map(m => m.id === id ? { ...m, content: m.content + chunk } : m)
            }));
        };

        return {
            updateConfig(config: Partial<AiChatState>) {
                patchState(store, config);
                if (config.isDarkMode !== undefined) updateTheme(config.isDarkMode);
            },

            toggleTheme() {
                const isDark = !store.isDarkMode();
                patchState(store, { isDarkMode: isDark });
                updateTheme(isDark);
            },

            toggleChat: () => patchState(store, { isOpen: !store.isOpen() }),
            setIsOpen: (isOpen: boolean) => patchState(store, { isOpen }),

            clearChat: () => patchState(store, { messages: [] }),

            stopRequest() {
                if (msgSubscription) {
                    msgSubscription.unsubscribe();
                    msgSubscription = null;
                }
                cohereService.stopStream();

                const messages = store.messages();
                const lastIdx = messages.length - 1;
                if (lastIdx >= 0 && messages[lastIdx].type === 'assistant') {
                    const id = messages[lastIdx].id;
                    appendToAssistantMsg(id, '\n*(הופסק על ידי המשתמש)*');
                    updateAssistantMsg(id, { isTyping: false });
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

                const history = [
                    { role: 'system', content: store.systemPrompt() },
                    ...store.messages().slice(0, -2).map(m => ({ role: m.type, content: m.content })),
                    { role: 'user', content }
                ];

                msgSubscription = cohereService.generateResponse(config, history).subscribe({
                    next: (chunk: string) => appendToAssistantMsg(assistantMsgId, chunk),
                    error: (err: any) => {
                        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('abort')) return;
                        console.error('[AiChatStore] Chat Error:', err);
                        appendToAssistantMsg(assistantMsgId, '\n[Error]');
                        updateAssistantMsg(assistantMsgId, { isTyping: false });
                        patchState(store, { isProcessing: false });
                    },
                    complete: () => {
                        updateAssistantMsg(assistantMsgId, { isTyping: false });
                        patchState(store, { isProcessing: false });
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
