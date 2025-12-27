import { useCallback, useRef, useEffect } from 'react';
import { AGENT_STEP_MESSAGES, DEFAULT_AGENT_MESSAGE } from '../constants/agentSteps';
import type { SupportedModel, AgentQueryData } from '../types/chats.api';
import { useStreamStore } from '../store/useStreamStore';

interface UseAgentStreamOptions {
    chatId: string;
    onStreamStart?: (chatId: string, query: string, videoId: string) => void;
    onStreamProgress?: (chatId: string, content: string) => void;
    onStreamComplete?: (chatId: string, query: string, answer: string) => void;
    onError?: (chatId: string, error: Error) => void;
}

interface AgentStreamResult {
    isStreaming: boolean;
    agentStatus: string;
    statusMessage: string;
    startStream: (query: string, videoId: string, model: SupportedModel, streamingMessageId: string) => Promise<string | null>;
    cancelStream: () => void;
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Global map to store abort controllers per chat
const abortControllers = new Map<string, AbortController>();

/**
 * Custom hook to handle Server-Sent Events (SSE) streaming from the AI Agent.
 * 
 * Now supports background streaming - streams continue even when switching chats.
 * Integrates with global stream store to track multiple concurrent streams.
 * 
 * @param options - Configuration options for the stream
 * @returns Stream state and control functions
 */
export const useAgentStream = ({
    chatId,
    onStreamStart,
    onStreamProgress,
    onStreamComplete,
    onError,
}: UseAgentStreamOptions): AgentStreamResult => {
    const streamStore = useStreamStore();
    const currentStream = useStreamStore((state) => state.activeStreams.get(chatId));
    
    // Get streaming state from the global store
    const isStreaming = currentStream?.isActive || false;
    const agentStatus = currentStream?.agentStatus || '';
    
    // Use a ref to track the current chat's controller
    const currentChatIdRef = useRef(chatId);

    // Update ref when chatId changes
    useEffect(() => {
        currentChatIdRef.current = chatId;
    }, [chatId]);

    /**
     * Get the user-friendly status message for the current agent step
     */
    const statusMessage = agentStatus 
        ? (AGENT_STEP_MESSAGES[agentStatus] || DEFAULT_AGENT_MESSAGE)
        : '';

    /**
     * Cancel the ongoing stream for this chat
     */
    const cancelStream = useCallback(() => {
        const controller = abortControllers.get(chatId);
        if (controller) {
            controller.abort();
            abortControllers.delete(chatId);
        }
        streamStore.removeStream(chatId);
    }, [chatId, streamStore]);

    /**
     * Internal function to perform the actual stream request
     */
    const performStream = useCallback(async (
        query: string,
        videoId: string,
        model: SupportedModel,
        streamingMessageId: string,
        retryCount: number = 0
    ): Promise<string | null> => {
        const MAX_RETRIES = 1;
        let accumulatedContent = '';

        const requestData: AgentQueryData = {
            query,
            video_id: videoId,
            model,
        };

        const controller = abortControllers.get(chatId);

        try {
            const response = await fetch(`${API_BASE_URL}/chats/agent/${chatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                signal: controller?.signal,
                body: JSON.stringify(requestData),
            });

            // Handle 401 - Token expired
            if (response.status === 401 && retryCount < MAX_RETRIES) {
                console.log('Access token expired during stream, refreshing...');
                
                try {
                    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                        method: 'GET',
                        credentials: 'include',
                    });

                    if (refreshResponse.ok) {
                        console.log('Token refreshed successfully, retrying stream...');
                        return await performStream(query, videoId, model, streamingMessageId, retryCount + 1);
                    } else {
                        throw new Error('Token refresh failed');
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh token:', refreshError);
                    throw new Error('Session expired. Please log in again.');
                }
            }

            if (!response.ok) {
                throw new Error(`Agent API returned ${response.status}: ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body is not readable');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const messages = buffer.split('\n\n');
                buffer = messages.pop() || '';

                for (const message of messages) {
                    if (!message.trim()) continue;

                    const lines = message.split('\n');
                    let currentEvent = '';
                    let currentData = '';

                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            currentEvent = line.replace('event: ', '').trim();
                        } else if (line.startsWith('data: ')) {
                            currentData = line.replace('data: ', '').trim();
                        }
                    }

                    if (currentEvent && currentData) {
                        if (currentEvent === 'agent_step') {
                            try {
                                const parsed = JSON.parse(currentData);
                                const stepName = parsed.name || currentData;
                                const stepMessage = AGENT_STEP_MESSAGES[stepName] || DEFAULT_AGENT_MESSAGE;
                                
                                // Update global store
                                streamStore.updateStreamStatus(chatId, stepName, stepMessage);
                            } catch {
                                const stepMessage = AGENT_STEP_MESSAGES[currentData] || DEFAULT_AGENT_MESSAGE;
                                streamStore.updateStreamStatus(chatId, currentData, stepMessage);
                            }
                        } else if (currentEvent === 'token') {
                            try {
                                const parsed = JSON.parse(currentData);
                                if (parsed.text) {
                                    accumulatedContent += parsed.text;
                                    
                                    // Notify progress callback if provided
                                    if (onStreamProgress) {
                                        onStreamProgress(chatId, accumulatedContent);
                                    }
                                }
                            } catch (e) {
                                console.warn('Failed to parse token data:', currentData);
                            }
                        }
                    }
                }
            }

            return accumulatedContent;

        } catch (error) {
            throw error;
        }
    }, [chatId, streamStore, onStreamProgress]);

    /**
     * Start streaming the agent response
     */
    const startStream = useCallback(async (
        query: string,
        videoId: string,
        model: SupportedModel,
        streamingMessageId: string
    ): Promise<string | null> => {
        // Cancel any existing stream for this chat
        cancelStream();

        // Create new abort controller for this chat
        const abortController = new AbortController();
        abortControllers.set(chatId, abortController);

        // Add stream to global store
        streamStore.addStream(chatId, {
            streamingMessageId,
            agentStatus: 'initializing',
            statusMessage: AGENT_STEP_MESSAGES['initializing'] || 'Initializing...',
            query,
            videoId,
        });

        // Notify start callback
        if (onStreamStart) {
            onStreamStart(chatId, query, videoId);
        }

        try {
            const finalContent = await performStream(query, videoId, model, streamingMessageId, 0);

            // Stream complete - pass chatId, query and answer to callback
            if (onStreamComplete && finalContent) {
                onStreamComplete(chatId, query, finalContent);
            }

            return finalContent;

        } catch (error) {
            // Don't treat abort as an error
            if (error instanceof Error && error.name === 'AbortError') {
                console.log(`[useAgentStream] Stream cancelled for chat: ${chatId}`);
                return null;
            }

            console.error(`[useAgentStream] Streaming error for chat ${chatId}:`, error);
            
            if (onError && error instanceof Error) {
                onError(chatId, error);
            }

            // Remove from store on error
            streamStore.removeStream(chatId);

            return null;

        } finally {
            // Cleanup abort controller
            abortControllers.delete(chatId);
        }
    }, [chatId, performStream, onStreamComplete, onStreamStart, onError, cancelStream, streamStore]);

    return {
        isStreaming,
        agentStatus,
        statusMessage,
        startStream,
        cancelStream,
    };
};

/**
 * Utility function to cancel all streams globally
 */
export const cancelAllStreams = () => {
    abortControllers.forEach((controller) => controller.abort());
    abortControllers.clear();
    useStreamStore.getState().clearAllStreams();
};
