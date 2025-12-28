/**
 * Chat Message Model
 */
export interface ChatMessage {
    id: string;
    content: string;
    type: 'user' | 'assistant' | 'system';
    timestamp: Date;
    isTyping?: boolean;
}
