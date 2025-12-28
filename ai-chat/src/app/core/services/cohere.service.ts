import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface CohereConfig {
    apiKey: string;
    modelName: string;
    systemPrompt: string;
    apiUrl: string;
    tools?: any[];
}

@Injectable({
    providedIn: 'root'
})
export class CohereService {
    private abortController: AbortController | null = null;
    private toolCache = new Map<string, any>();

    private ensureJsonString(val: any): string {
        if (!val) return '{}';
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (!trimmed) return '{}';
            try {
                JSON.parse(trimmed);
                return trimmed;
            } catch {
                return JSON.stringify(trimmed);
            }
        }
        return JSON.stringify(val);
    }

    stopStream(): void {
        this.abortController?.abort();
        this.abortController = null;
    }

    generateResponse(config: CohereConfig, messages: any[]): Observable<string> {
        this.stopStream();
        this.abortController = new AbortController();
        const subject = new Subject<string>();

        const body = {
            model: config.modelName,
            messages: messages,
            stream: true,
            tools: this.transformTools(config.tools)
        };

        console.log('[Cohere V2] Request Body:', JSON.stringify(body, null, 2));
        this.processRequest(config, body, subject);
        return subject.asObservable();
    }

    private transformTools(tools?: any[]): any[] | undefined {
        if (!tools?.length) return undefined;
        return tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters || { type: 'object', properties: {}, required: [] }
            }
        }));
    }

    private async processRequest(config: CohereConfig, body: any, subject: Subject<string>): Promise<void> {
        try {
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: this.abortController?.signal
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[Cohere V2] API Error Response:', error);
                throw new Error(`API Error ${response.status}: ${error}`);
            }

            if (!response.body) throw new Error('Response body is null');
            console.log('[Cohere V2] Stream opened');
            await this.readStream(response.body, config, body.messages, subject);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('[Cohere V2] Error:', error);
                subject.error(error);
            } else {
                console.log('[Cohere V2] Stream aborted by user');
                subject.complete();
            }
        }
    }

    private async readStream(
        stream: ReadableStream<Uint8Array>,
        config: CohereConfig,
        previousMessages: any[],
        subject: Subject<string>
    ): Promise<void> {
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        const toolCallsMap = new Map<number, any>();
        let assistantMsgForFollowup: any = null;
        let buffer = '';
        let currentEventType: string | null = null;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log('[Cohere V2] Stream reader done');
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith('event:')) {
                        currentEventType = trimmed.substring(6).trim();
                        continue;
                    }

                    try {
                        const cleanLine = trimmed.startsWith('data: ') ? trimmed.substring(6) : trimmed;

                        // Only try to parse if it looks like a JSON object
                        if (!cleanLine.startsWith('{')) continue;

                        const parsed = JSON.parse(cleanLine);
                        const eventType = parsed.type || currentEventType;
                        console.log('[Cohere V2] Event Type:', eventType);

                        switch (eventType) {
                            case 'content-delta':
                            case 'text-generation':
                                const text = parsed.delta?.message?.content?.text || parsed.text;
                                if (text) subject.next(text);
                                break;

                            case 'tool-call-start':
                                const deltaStart = parsed.delta?.message?.tool_calls;
                                if (deltaStart) {
                                    toolCallsMap.set(parsed.index, {
                                        id: deltaStart.id,
                                        name: deltaStart.function.name,
                                        arguments: deltaStart.function.arguments || ''
                                    });
                                }
                                break;

                            case 'tool-call-delta':
                                const deltaArgs = parsed.delta?.message?.tool_calls?.function?.arguments;
                                const call = toolCallsMap.get(parsed.index);
                                if (call && deltaArgs) {
                                    call.arguments += deltaArgs;
                                }
                                break;

                            case 'message-end':
                                assistantMsgForFollowup = parsed.message;
                                const toolCalls = Array.from(toolCallsMap.values());

                                if (toolCalls.length > 0) {
                                    console.log('[Cohere V2] Processing Tool Calls:', toolCalls.length);
                                    await this.handleToolCalls(toolCalls, assistantMsgForFollowup, config, previousMessages, subject);
                                    reader.cancel();
                                    return;
                                }
                                subject.complete();
                                reader.cancel();
                                return;

                            case 'stream-end':
                                console.log('[Cohere V2] Stream ended by server');
                                subject.complete();
                                reader.cancel();
                                return;
                        }
                    } catch (e) {
                        console.warn('[Cohere V2] JSON parse error:', e, 'on line:', trimmed);
                        continue;
                    }
                }
            }
            subject.complete();
        } finally {
            reader.releaseLock();
        }
    }

    private async handleToolCalls(
        toolCalls: any[],
        assistantMessage: any,
        config: CohereConfig,
        previousMessages: any[],
        subject: Subject<string>
    ): Promise<void> {
        const toolResults = await Promise.all(toolCalls.map(async (call) => {
            const safeArgs = this.ensureJsonString(call.arguments);
            const cacheKey = `${call.name}:${safeArgs}`;

            if (this.toolCache.has(cacheKey)) {
                return {
                    role: 'tool',
                    tool_call_id: call.id,
                    content: JSON.stringify(this.toolCache.get(cacheKey))
                };
            }

            const tool = config.tools?.find(t => t.name === call.name);
            let result: any = { error: `Tool ${call.name} not found` };

            if (tool?.handler) {
                try {
                    const params = JSON.parse(safeArgs);
                    const output = await tool.handler(params);
                    result = Array.isArray(output) ? output : [output];
                    this.toolCache.set(cacheKey, result);
                } catch (err) {
                    result = { error: `Execution failed: ${err}` };
                }
            }

            return {
                role: 'tool',
                tool_call_id: call.id,
                content: JSON.stringify(result)
            };
        }));

        const nextBody = {
            model: config.modelName,
            messages: [
                ...previousMessages,
                {
                    role: 'assistant',
                    tool_calls: (assistantMessage?.tool_calls || toolCalls).map((tc: any) => ({
                        id: tc.id || tc.tool_call_id,
                        type: 'function',
                        function: {
                            name: tc.name || tc.function?.name,
                            arguments: this.ensureJsonString(tc.arguments || tc.function?.arguments)
                        }
                    }))
                },
                ...toolResults
            ],
            stream: true,
            tools: this.transformTools(config.tools)
        };

        console.log('[Cohere V2] Next Request Body:', JSON.stringify(nextBody, null, 2));
        await this.processRequest(config, nextBody, subject);
    }
}
