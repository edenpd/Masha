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

export interface ModelConfig {
    systemPrompt: string;
    apiKey?: string;
    modelName?: string;
    apiUrl?: string;
    tools?: any[];
    documents?: any[];
}

export interface DesignConfig {
    mode?: 'embedded' | 'popover';
    width?: string;
    height?: string;
    isDarkMode?: boolean;
}

export interface ChatUIConfig {
    userPhoto?: string;
    inputPlaceholder?: string;
    emptyChatTitle?: string;
    emptyChatSubtitle?: string;
    questionSuggestions?: string[];
    startMessage?: string;
    title?: string;
}

export interface AiChatConfig {
    model: ModelConfig;
    design?: DesignConfig;
    chat?: ChatUIConfig;
}

export interface AiChatState extends Required<ModelConfig>, Required<DesignConfig>, Required<ChatUIConfig> {
    // Chat State
    messages: ChatMessage[];
    isProcessing: boolean;
    isOpen: boolean;

    // UI
    isLoading: boolean;
    error: string | null;
}

const initialState: AiChatState = {
    // Model Defaults
    apiKey: '',
    modelName: 'command-r-08-2024',
    systemPrompt: '',
    apiUrl: 'https://api.cohere.com/v2/chat',
    tools: [],
    documents: [],

    // Design Defaults
    mode: 'embedded',
    width: '600px',
    height: '600px',
    isDarkMode: false,

    // Chat UI Defaults
    userPhoto: 'https://ui-avatars.com/api/?name=User',
    inputPlaceholder: 'במה ניתן לעזור?',
    emptyChatTitle: 'התחל שיחה',
    emptyChatSubtitle: 'שאל אותי משהו...',
    questionSuggestions: [],
    startMessage: 'היי! איך אפשר לעזור לך היום?',
    title: 'AI Chat',

    // Internal State
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
            updateConfig(config: AiChatConfig) {
                const flatConfig: Partial<AiChatState> = {
                    ...config.model,
                    ...config.design,
                    ...config.chat
                };
                patchState(store, flatConfig as any);
            },

            toggleTheme() {
                const isDark = !store.isDarkMode();
                patchState(store, { isDarkMode: isDark });
            },

            toggleChat: () => patchState(store, { isOpen: !store.isOpen() }),
            setIsOpen: (isOpen: boolean) => patchState(store, { isOpen }),

            clearChat(initialMessage?: string) {
                this.stopRequest();

                const messages: ChatMessage[] = [];
                const finalInitialMessage = initialMessage || store.startMessage();

                if (finalInitialMessage) {
                    messages.push({
                        type: 'assistant',
                        content: finalInitialMessage,
                        id: crypto.randomUUID(),
                        timestamp: new Date()
                    });
                }

                patchState(store, { messages });
            },

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
                        appendToAssistantMsg(assistantMsgId, '\n❌ אירעה שגיאה בעיבוד הבקשה. נסה שוב.');
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
                if (store.startMessage() && store.messages().length === 0) {
                    const startMsg = { type: 'assistant', content: store.startMessage(), id: crypto.randomUUID(), timestamp: new Date() } as ChatMessage;
                    patchState(store, { messages: [startMsg] });
                }
            }
        };
    })
);
