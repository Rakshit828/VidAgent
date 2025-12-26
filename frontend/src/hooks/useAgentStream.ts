import { useState, useCallback, useRef } from 'react';
import { AGENT_STEP_MESSAGES, DEFAULT_AGENT_MESSAGE } from '../constants/agentSteps';

interface UseAgentStreamOptions {
    chatId: string;
    onStreamComplete?: (finalMessage: string) => void;
    onError?: (error: Error) => void;
}

interface AgentStreamResult {
    isStreaming: boolean;
    agentStatus: string;
    statusMessage: string;
    startStream: (query: string, videoId: string) => Promise<string | null>;
    cancelStream: () => void;
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Custom hook to handle Server-Sent Events (SSE) streaming from the AI Agent.
 * 
 * This hook manages the connection to the backend agent endpoint, parses
 * SSE events (agent_step and token), and provides real-time updates to the UI.
 * 
 * @param options - Configuration options for the stream
 * @returns Stream state and control functions
 * 
 * @example
 * ```tsx
 * const { isStreaming, agentStatus, statusMessage, startStream } = useAgentStream({
 *   chatId: 'chat-uuid',
 *   onStreamComplete: (message) => console.log('Final:', message),
 * });
 * 
 * // Start streaming
 * const response = await startStream('What is this video about?', 'video-id');
 * ```
 */
export const useAgentStream = ({
    chatId,
    onStreamComplete,
    onError,
}: UseAgentStreamOptions): AgentStreamResult => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [agentStatus, setAgentStatus] = useState('');
    
    // Use a ref to track the abort controller for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);

    /**
     * Get the user-friendly status message for the current agent step
     */
    const statusMessage = agentStatus 
        ? (AGENT_STEP_MESSAGES[agentStatus] || DEFAULT_AGENT_MESSAGE)
        : '';

    /**
     * Cancel the ongoing stream
     */
    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setAgentStatus('');
    }, []);

    /**
     * Internal function to perform the actual stream request
     * 
     * @param query - User's question
     * @param videoId - YouTube video ID
     * @param retryCount - Current retry attempt (0 = first attempt)
     * @returns The complete assistant response or null on error
     */
    const performStream = useCallback(async (
        query: string,
        videoId: string,
        retryCount: number = 0
    ): Promise<string | null> => {
        const MAX_RETRIES = 1;
        let accumulatedContent = '';

        try {
            const response = await fetch(`${API_BASE_URL}/chats/agent/${chatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookie-based auth
                signal: abortControllerRef.current?.signal,
                body: JSON.stringify({
                    query,
                    video_id: videoId,
                }),
            });

            // Handle 401 - Token expired
            if (response.status === 401 && retryCount < MAX_RETRIES) {
                console.log('Access token expired during stream, refreshing...');
                
                try {
                    // Attempt to refresh the access token
                    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                        method: 'GET',
                        credentials: 'include',
                    });

                    if (refreshResponse.ok) {
                        console.log('Token refreshed successfully, retrying stream...');
                        // Recursively retry the stream with incremented retry count
                        return await performStream(query, videoId, retryCount + 1);
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
            let buffer = ''; // Buffer for incomplete chunks

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                // Decode the chunk and add to buffer
                buffer += decoder.decode(value, { stream: true });
                
                // Split by double newline to get complete SSE messages
                const messages = buffer.split('\n\n');
                
                // Keep the last incomplete message in the buffer
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

                    // Process the event
                    if (currentEvent && currentData) {
                        if (currentEvent === 'agent_step') {
                            try {
                                const parsed = JSON.parse(currentData);
                                setAgentStatus(parsed.name || currentData);
                            } catch {
                                // If not JSON, treat as raw string
                                setAgentStatus(currentData);
                            }
                        } else if (currentEvent === 'token') {
                            try {
                                const parsed = JSON.parse(currentData);
                                if (parsed.text) {
                                    accumulatedContent += parsed.text;
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
            // Re-throw to be caught by the outer handler
            throw error;
        }
    }, [chatId]);

    /**
     * Start streaming the agent response with automatic token refresh on 401
     * 
     * @param query - User's question about the video
     * @param videoId - YouTube video ID
     * @returns The complete assistant response or null on error
     */
    const startStream = useCallback(async (
        query: string,
        videoId: string
    ): Promise<string | null> => {
        // Cancel any existing stream
        cancelStream();

        // Create new abort controller for this request
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsStreaming(true);
        setAgentStatus('initializing');

        try {
            const finalContent = await performStream(query, videoId, 0);

            // Stream complete
            if (onStreamComplete && finalContent) {
                onStreamComplete(finalContent);
            }

            return finalContent;

        } catch (error) {
            // Don't treat abort as an error
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Stream cancelled by user');
                return null;
            }

            console.error('Agent streaming error:', error);
            
            if (onError && error instanceof Error) {
                onError(error);
            }

            return null;

        } finally {
            setIsStreaming(false);
            setAgentStatus('');
            abortControllerRef.current = null;
        }
    }, [performStream, onStreamComplete, onError, cancelStream]);

    return {
        isStreaming,
        agentStatus,
        statusMessage,
        startStream,
        cancelStream,
    };
};
