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

@Injectable({
    providedIn: 'root'
})
export class CohereService {
    private abortController: AbortController | null = null;
    private toolCache = new Map<string, any>();

    stopStream(): void {
        this.abortController?.abort();
        this.abortController = null;
    }

    generateResponse(config: CohereConfig, query: string, chatHistory: any[] = []): Observable<string> {
        this.stopStream();
        this.abortController = new AbortController();
        const subject = new Subject<string>();

        const initialBody = {
            message: query,
            model: config.modelName,
            preamble: config.systemPrompt,
            stream: true,
            tools: config.tools,
            documents: config.documents,
            chat_history: chatHistory
        };

        this.processRequest(config, initialBody, subject);

        return subject.asObservable();
    }

    private async processRequest(config: CohereConfig, body: any, subject: Subject<string>): Promise<void> {
        try {
            console.log('Sending Cohere Request:', body);
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body),
                signal: this.abortController?.signal
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API Error ${response.status}: ${error}`);
            }

            if (!response.body) throw new Error('Response body is null');

            await this.readStream(response.body, config, body.message, body.chat_history || [], subject);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Cohere API Error:', error);
                subject.error(error);
            } else {
                subject.complete();
            }
        }
    }

    private async readStream(
        stream: ReadableStream<Uint8Array>,
        config: CohereConfig,
        originalQuery: string,
        chatHistory: any[],
        subject: Subject<string>
    ): Promise<void> {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let toolCalls: any[] = [];

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const lines = decoder.decode(value, { stream: true }).split('\n');
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = JSON.parse(line);

                        if (parsed.event_type === 'text-generation') {
                            subject.next(parsed.text);
                        } else if (parsed.event_type === 'tool-calls-generation') {
                            toolCalls = parsed.tool_calls;
                        } else if (parsed.event_type === 'stream-end') {
                            if (toolCalls.length > 0) {
                                await this.handleToolCalls(toolCalls, config, originalQuery, chatHistory, subject);
                                return; // Stop here, handleToolCalls will continue the flow
                            }
                            subject.complete();
                            return;
                        }
                    } catch (e) { continue; }
                }
            }
            subject.complete();
        } finally {
            reader.releaseLock();
        }
    }

    private async handleToolCalls(
        toolCalls: any[],
        config: CohereConfig,
        originalQuery: string,
        chatHistory: any[],
        subject: Subject<string>
    ): Promise<void> {
        const toolResults = await Promise.all(toolCalls.map(async (call) => {
            const cacheKey = `${call.name}:${JSON.stringify(call.parameters)}`;

            if (this.toolCache.has(cacheKey)) {
                console.log(`[Cache Hit] Tool: ${call.name}`);
                return { call, outputs: this.toolCache.get(cacheKey) };
            }

            const tool = config.tools?.find(t => t.name === call.name);
            let outputs = [{ error: `Tool ${call.name} not found or handler missing` }];

            if (tool?.handler) {
                try {
                    const result = await tool.handler(call.parameters);
                    outputs = Array.isArray(result) ? result : [result];
                    this.toolCache.set(cacheKey, outputs);
                } catch (err) {
                    console.error(`Tool ${call.name} execution failed:`, err);
                    outputs = [{ error: `Execution failed: ${err}` }];
                }
            }
            return { call, outputs };
        }));

        // Send second request with results
        const nextBody = {
            message: originalQuery,
            model: config.modelName,
            preamble: config.systemPrompt,
            stream: true,
            tools: config.tools,
            tool_results: toolResults,
            chat_history: chatHistory,
            force_single_step: true // Required for step 2
        };

        await this.processRequest(config, nextBody, subject);
    }
}
