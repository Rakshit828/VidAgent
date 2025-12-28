import { QueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chats';
import { useStreamStore } from '../store/useStreamStore';
import { toast } from 'sonner';

/**
 * Callback type for stream completion
 */
export type StreamCompletionCallback = (chatId: string, query: string, answer: string) => void;

/**
 * Callback type for stream error
 */
export type StreamErrorCallback = (chatId: string, error: Error) => void;

/**
 * StreamManager - The Persistence Orchestrator (Singleton)
 * 
 * LOGIC & PURPOSE:
 * 1. PERSISTENCE SOURCE OF TRUTH: Handles the transition from a volatile AI stream to a permanent database record.
 * 2. OPTIMISTIC UPDATES: Immediately injects the generated answer into the TanStack Query cache 
 *    before the DB save finishes, ensuring 0ms latency for the user.
 * 3. DB SYNCHRONIZATION: Saves the Q&A pair to the backend and then "re-hydrates" the cache 
 *    with the real server-generated IDs and timestamps.
 * 4. BACKGROUND NOTIFICATIONS: Detects if a stream completed in a chat that is NOT the current active one, 
 *    and triggers a "Response ready!" toast notification with navigation support.
 * 5. ERROR RECOVERY: Implements cache rollbacks if a database save fails after an optimistic update.
 */
class StreamManager {
  private static instance: StreamManager;
  private queryClient: QueryClient | null = null;
  private completionCallbacks: Set<StreamCompletionCallback> = new Set();
  private errorCallbacks: Set<StreamErrorCallback> = new Set();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  /**
   * Initialize with query client
   */
  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Register a callback for stream completion
   */
  onStreamComplete(callback: StreamCompletionCallback) {
    this.completionCallbacks.add(callback);
    return () => {
      this.completionCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for stream errors
   */
  onStreamError(callback: StreamErrorCallback) {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Handle stream completion - save to DB and update cache
   */
  async handleStreamComplete(
    chatId: string,
    query: string,
    answer: string,
    isCurrentChat: boolean
  ): Promise<void> {
    console.log(`[StreamManager] Stream completed for chat: ${chatId}, isCurrentChat: ${isCurrentChat}`);

    let previousData: any = null;
    
    try {
      // 1. Update the query cache OPTIMISTICALLY first
      // This ensures the message appears in the UI immediately without waiting for the DB save
      if (this.queryClient) {
        // Ensure we have the base data (fetch if missing/race condition)
        await this.queryClient.ensureQueryData({
            queryKey: ['chat-data', chatId],
            queryFn: () => chatApi.getChatData(chatId).then(res => res.data)
        });

        // Snapshot previous data for rollback
        previousData = this.queryClient.getQueryData(['chat-data', chatId]);

        // Wrap in a promise to ensure synchronous execution
        await new Promise<void>((resolve) => {
          this.queryClient!.setQueryData(['chat-data', chatId], (old: any) => {
            if (!old) return old;

            // Check if this QA already exists (unlikely but safe)
            const exists = old.data?.questions_answers?.some(
              (qa: any) => qa.query === query && qa.answer === answer
            );
            if (exists) return old;

            return {
              ...old,
              data: {
                ...old.data,
                questions_answers: [
                  ...(old.data?.questions_answers || []),
                  {
                    query,
                    answer,
                    created_at: new Date().toISOString(),
                  },
                ],
              },
            };
          });
          
          // Give React time to process the state update
          const callback = () => resolve();
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(callback, { timeout: 50 });
          } else {
            setTimeout(callback, 16);
          }
        });
        console.log(`[StreamManager] Cache updated optimistically for chat: ${chatId}`);
      }

      // 2. Save Q&A to database in the background
      const response = await chatApi.createQA(chatId, { query, answer });
      const savedQA = response.data?.data;

      // 3. Confirm the save by updating cache with REAL server data (if available)
      if (this.queryClient && savedQA) {
          this.queryClient.setQueryData(['chat-data', chatId], (old: any) => {
              if (!old?.data?.questions_answers) return old;
              
              const qas = [...old.data.questions_answers];
              // Find the optimistic entry we just added (last one likely, or match content)
              const index = qas.findIndex((qa: any) => qa.query === query && qa.answer === answer);
              
              if (index !== -1) {
                  // Update with server data (preserves order, updates timestamp/id)
                  qas[index] = savedQA;
                  return {
                      ...old,
                      data: {
                          ...old.data,
                          questions_answers: qas
                      }
                  };
              }
              return old;
          });
      }

      console.log(`[StreamManager] Q&A saved to database for chat: ${chatId}`);

      // 4. Remove from active streams
      useStreamStore.getState().removeStream(chatId);

      // 5. Notify all registered callbacks
      this.completionCallbacks.forEach((callback) => {
        callback(chatId, query, answer);
      });

      // 6. Show notification if this was a background stream
      if (!isCurrentChat) {
        toast.success('Response ready!', {
          description: 'Click to view the completed analysis',
          action: {
            label: 'View',
            onClick: () => {
              window.dispatchEvent(
                new CustomEvent('navigate-to-chat', { detail: { chatId } })
              );
            },
          },
          duration: 5000,
        });
      }

    } catch (error) {
      console.error(`[StreamManager] Failed to save Q&A for chat ${chatId}:`, error);
      
      // ROLLBACK CACHE if save failed
      if (this.queryClient && previousData) {
          console.log(`[StreamManager] Rolling back cache for chat: ${chatId}`);
          this.queryClient.setQueryData(['chat-data', chatId], previousData);
      }

      // Remove from active streams even on error
      useStreamStore.getState().removeStream(chatId);
      
      // Notify error callbacks
      this.errorCallbacks.forEach((callback) => {
        callback(chatId, error as Error);
      });

      toast.error('Failed to save response', {
        description: 'The response was generated but could not be saved.',
      });
    }
  }

  /**
   * Handle stream error
   */
  handleStreamError(chatId: string, error: Error): void {
    console.error(`[StreamManager] Stream error for chat ${chatId}:`, error);
    
    // Remove from active streams
    useStreamStore.getState().removeStream(chatId);
    
    // Notify error callbacks
    this.errorCallbacks.forEach((callback) => {
      callback(chatId, error);
    });
  }

  /**
   * Cancel a specific stream
   */
  cancelStream(chatId: string): void {
    console.log(`[StreamManager] Cancelling stream for chat: ${chatId}`);
    useStreamStore.getState().removeStream(chatId);
  }

  /**
   * Cancel all active streams
   */
  cancelAllStreams(): void {
    console.log('[StreamManager] Cancelling all streams');
    useStreamStore.getState().clearAllStreams();
  }

  /**
   * Get count of active streams
   */
  getActiveStreamCount(): number {
    return useStreamStore.getState().getAllActiveStreams().length;
  }
}

// Export singleton instance
export const streamManager = StreamManager.getInstance();
