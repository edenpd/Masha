import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface CohereConfig {
    apiKey: string;
    modelName: string;
    systemPrompt: string;
    apiUrl: string;
    tools?: any[];
    documents?: any[];
}

@Injectable({ providedIn: 'root' })
export class CohereService {
    private abortController: AbortController | null = null;
    private toolCache = new Map<string, any>();

    /**
     * Stops the current active stream and clears the controller.
     */
    stopStream(): void {
        this.abortController?.abort();
        this.abortController = null;
    }

    /**
     * Entry point to start a conversational response from Cohere.
     */
    generateResponse(config: CohereConfig, messages: any[]): Observable<string> {
        this.stopStream();
        this.abortController = new AbortController();
        const subject = new Subject<string>();

        const body = {
            model: config.modelName,
            messages,
            stream: true,
            tools: this.transformTools(config.tools),
            documents: config.documents
        };

        this.processRequest(config, body, subject);
        return subject.asObservable();
    }

    /**
     * Handles the HTTP POST request and initiates stream reading.
     */
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
                const errorText = await response.text();
                throw new Error(`Cohere API Error ${response.status}: ${errorText}`);
            }

            if (!response.body) throw new Error('Response body is unavailable');
            await this.readStream(response.body, config, body.messages, subject);

        } catch (error: any) {
            if (error.name === 'AbortError') {
                subject.complete();
            } else {
                console.error('[CohereService] processRequest Error:', error);
                subject.error(error);
            }
        }
    }

    /**
     * Reads and parses the NDJSON/SSE stream from the API.
     */
    private async readStream(
        stream: ReadableStream<Uint8Array>,
        config: CohereConfig,
        previousMessages: any[],
        subject: Subject<string>
    ): Promise<void> {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        const toolCallsMap = new Map<number, any>();
        let buffer = '';
        let currentEventType: string | null = null;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    // Handle SSE event headers
                    if (trimmed.startsWith('event:')) {
                        currentEventType = trimmed.substring(6).trim();
                        continue;
                    }

                    try {
                        const cleanLine = trimmed.startsWith('data: ') ? trimmed.substring(6) : trimmed;
                        if (!cleanLine.startsWith('{')) continue;

                        const parsed = JSON.parse(cleanLine);
                        const eventType = parsed.type || currentEventType;

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
                                if (call && deltaArgs) call.arguments += deltaArgs;
                                break;

                            case 'message-end':
                                const toolCalls = Array.from(toolCallsMap.values());
                                if (toolCalls.length > 0) {
                                    await this.handleToolCalls(toolCalls, parsed.message, config, previousMessages, subject);
                                } else {
                                    subject.complete();
                                }
                                reader.cancel();
                                return;

                            case 'stream-end':
                                subject.complete();
                                reader.cancel();
                                return;
                        }
                    } catch (e) {
                        console.warn('[CohereService] NDJSON Parse Warning:', e);
                    }
                }
            }
            subject.complete();
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Executes tool calls, collects results, and triggers the next conversational turn.
     */
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

            // Check cache
            if (this.toolCache.has(cacheKey)) {
                return this.wrapToolResult(call.id, this.toolCache.get(cacheKey));
            }

            // Execute handler
            const tool = config.tools?.find(t => t.name === call.name);
            let result: any;
            try {
                if (!tool?.handler) throw new Error(`Tool handler for "${call.name}" not found`);
                const params = JSON.parse(safeArgs);
                result = await tool.handler(params);
                result = Array.isArray(result) ? result : [result];
                this.toolCache.set(cacheKey, result);
            } catch (err) {
                result = { error: String(err) };
            }

            return this.wrapToolResult(call.id, result);
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

        await this.processRequest(config, nextBody, subject);
    }

    /** 
     * Helpers
     */

    private wrapToolResult(id: string, content: any) {
        return { role: 'tool', tool_call_id: id, content: JSON.stringify(content) };
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

    private ensureJsonString(val: any): string {
        if (!val) return '{}';
        if (typeof val !== 'string') return JSON.stringify(val);
        const trimmed = val.trim();
        if (!trimmed) return '{}';
        try {
            JSON.parse(trimmed);
            return trimmed;
        } catch {
            return JSON.stringify(trimmed);
        }
    }
}
