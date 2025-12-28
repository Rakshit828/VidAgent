import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/chats';
import { AGENT_STEP_MESSAGES, DEFAULT_AGENT_MESSAGE } from '../constants/agentSteps';
import { useStreamStore } from '../store/useStreamStore';
import { streamManager } from '../services/streamManager';
import type { ChatMessage, QA } from '../types';
import type { SupportedModel, AgentQueryData } from '../types/chats.api';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface UseChatSessionOptions {
    chatId: string | undefined;
}

interface ChatSessionReturn {
    // State
    messages: ChatMessage[];
    isStreaming: boolean;
    streamingContent: string;
    agentStatusMessage: string;
    isLoading: boolean;
    
    // Actions
    sendMessage: (query: string, videoId: string, model: SupportedModel) => Promise<void>;
    cancelStream: () => void;
}

/**
 * useChatSession - The Orchestrator for Chat Interactions
 * 
 * ARCHITECTURE:
 * This hook implements a "Global-Local Hybrid" state management pattern:
 * 1. LOCAL STATE (messages): Fast, responsive UI updates for the active chat.
 * 2. GLOBAL STORE (useStreamStore): Tracks active streams across ALL chats to support background processing.
 * 3. TANSTACK QUERY: Used for initial data load (persistence) and caching.
 * 4. STREAM MANAGER: A singleton service that handles post-stream persistence (DB/Cache) globally.
 * 
 * LOGIC FLOW:
 * - Initialization: Syncs local 'messages' with TanStack Query cache.
 * - Background Sync: If the user switches back to a chat that is currently streaming, 
 *   it derives isStreaming/content from the global store to resume visual progress.
 * - Message Cycle: 
 *   a) User message is added to local state immediately.
 *   b) Stream is registered in Global Store (sidebar reflects this).
 *   c) Progress tokens update Global Store -> UI reflects tokens.
 *   d) Completion: Final message added to local state; StreamManager handles DB save.
 */
export function useChatSession({ chatId }: UseChatSessionOptions): ChatSessionReturn {
    const streamStore = useStreamStore();
    
    // ========== GLOBAL STREAM SYNC ==========
    // We derive streaming state from the global store. This ensures that if you start 
    // a stream in Chat A, switch to Chat B, and come back to Chat A, the UI 
    // "re-connects" to the active background stream seamlessly.
    const activeStream = useStreamStore(
        useCallback((state) => state.activeStreams.get(chatId || ''), [chatId])
    );
    
    const isStreaming = !!activeStream;
    const streamingContent = activeStream?.accumulatedContent || '';
    const agentStatusMessage = activeStream?.statusMessage || '';
    
    // ========== LOCAL MESSAGE STATE ==========
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    // Track the current chatId in a ref to handle background completions
    const currentChatIdRef = useRef(chatId);
    useEffect(() => {
        currentChatIdRef.current = chatId;
    }, [chatId]);
    
    // Track if we've initialized for the current chatId
    const initializedChatIdRef = useRef<string | null>(null);
    const lastSyncedDataJsonRef = useRef<string>("");
    const abortControllerRef = useRef<AbortController | null>(null);
    
    // ========== INITIAL DATA FETCH ==========
    const { data: chatData, isLoading: isInitialLoading } = useQuery({
        queryKey: ['chat-data', chatId],
        queryFn: () => chatId ? chatApi.getChatData(chatId).then(res => res.data) : null,
        enabled: !!chatId,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });
    
    // ========== SYNC INITIAL DATA ==========
    // This effect synchronizes the local 'messages' state with the TanStack Query cache.
    // It runs when the chatId changes (switching chats) OR when the cache data actually changes
    // (e.g. conversation cleared, or server IDs updated after a stream).
    useEffect(() => {
        if (!chatId) {
            setMessages([]);
            initializedChatIdRef.current = null;
            lastSyncedDataJsonRef.current = "";
            return;
        }
        
        const currentDataJson = JSON.stringify(chatData?.data?.questions_answers || []);
        
        // Optimization: Avoid re-syncing if we are on the same chat and data hasn't changed.
        // This prevents unnecessary flickering during active streaming.
        if (initializedChatIdRef.current === chatId && lastSyncedDataJsonRef.current === currentDataJson) {
            return;
        }
        
        if (chatData?.data?.questions_answers) {
            const loadedMessages: ChatMessage[] = [];
            chatData.data.questions_answers.forEach((qa: any, index: number) => {
                const timestamp = qa.created_at
                    ? new Date(qa.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';
                
                loadedMessages.push({
                    id: qa.id?.toString() || `q-${index}`, // Use real ID if available
                    role: 'user',
                    content: qa.query,
                    timestamp
                });
                loadedMessages.push({
                    id: qa.id?.toString() || `a-${index}`, // Use real ID if available
                    role: 'assistant',
                    content: qa.answer,
                    timestamp
                });
            });
            
            setMessages(loadedMessages);
            initializedChatIdRef.current = chatId;
            lastSyncedDataJsonRef.current = currentDataJson;
        } else if (!isInitialLoading) {
            setMessages([]);
            initializedChatIdRef.current = chatId;
            lastSyncedDataJsonRef.current = currentDataJson;
        }
    }, [chatId, chatData, isInitialLoading]);
    
    // ========== SEND MESSAGE ==========
    const sendMessage = useCallback(async (
        query: string,
        videoId: string,
        model: SupportedModel
    ): Promise<void> => {
        if (!chatId || isStreaming) return;
        
        // 1. Add user message locally
        const userCount = messages.filter(m => m.role === 'user').length;
        const userMsg: ChatMessage = {
            id: `q-${userCount}`,
            role: 'user',
            content: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, userMsg]);
        
        // 2. Initialize global stream store
        streamStore.addStream(chatId, {
            query,
            videoId,
            agentStatus: 'initializing',
            statusMessage: 'Initializing...',
            model
        });
        
        abortControllerRef.current = new AbortController();
        let currentAccumulated = '';
        
        try {
            const requestData: AgentQueryData = { query, video_id: videoId, model };
            
            const response = await fetch(`${API_BASE_URL}/chats/agent/${chatId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: abortControllerRef.current.signal,
                body: JSON.stringify(requestData),
            });
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Unreadable stream');
            
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split('\n\n');
                buffer = chunks.pop() || '';
                
                for (const chunk of chunks) {
                    if (!chunk.trim()) continue;
                    const lines = chunk.split('\n');
                    let eventType = '', eventData = '';
                    
                    for (const line of lines) {
                        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
                        else if (line.startsWith('data: ')) eventData = line.slice(6).trim();
                    }
                    
                    if (eventType === 'agent_step') {
                        try {
                            const parsed = JSON.parse(eventData);
                            const stepName = parsed.name || eventData;
                            const status = AGENT_STEP_MESSAGES[stepName] || DEFAULT_AGENT_MESSAGE;
                            streamStore.updateStreamStatus(chatId, stepName, status);
                        } catch (e) {
                            const status = AGENT_STEP_MESSAGES[eventData] || DEFAULT_AGENT_MESSAGE;
                            streamStore.updateStreamStatus(chatId, eventData, status);
                        }
                    } else if (eventType === 'token') {
                        try {
                            const parsed = JSON.parse(eventData);
                            if (parsed.text) {
                                currentAccumulated += parsed.text;
                                streamStore.updateStreamContent(chatId, currentAccumulated);
                            }
                        } catch {}
                    }
                }
            }
            
            // 3. Stream Complete
            // Update local messages if we are still on this chat
            if (currentChatIdRef.current === chatId && currentAccumulated) {
                const assistantMsg: ChatMessage = {
                    id: `a-${userCount}`,
                    role: 'assistant',
                    content: currentAccumulated,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, assistantMsg]);
            }
            
            // 4. Delegate DB save and cache update to StreamManager
            await streamManager.handleStreamComplete(
                chatId,
                query,
                currentAccumulated,
                currentChatIdRef.current === chatId
            );
            
        } catch (error) {
            console.error('[useChatSession] Error:', error);
        } finally {
            // Always remove from store when done
            streamStore.removeStream(chatId);
            abortControllerRef.current = null;
        }
    }, [chatId, isStreaming, messages, streamStore]);
    
    // ========== CANCEL STREAM ==========
    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        if (chatId) streamStore.removeStream(chatId);
    }, [chatId, streamStore]);
    
    return {
        messages,
        isStreaming,
        streamingContent,
        agentStatusMessage,
        isLoading: isInitialLoading && !initializedChatIdRef.current,
        sendMessage,
        cancelStream,
    };
}
