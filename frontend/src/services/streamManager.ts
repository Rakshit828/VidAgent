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
 * StreamManager - Singleton service to orchestrate background streams
 * Handles stream lifecycle, database saves, and cache updates
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

    try {
      // 1. Update the query cache OPTIMISTICALLY first
      // This ensures the message appears in the UI immediately without waiting for the DB save
      if (this.queryClient) {
        this.queryClient.setQueryData(['chat-data', chatId], (old: any) => {
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
        console.log(`[StreamManager] Cache updated optimistically for chat: ${chatId}`);
      }

      // 2. Save Q&A to database in the background
      await chatApi.createQA(chatId, { query, answer });
      console.log(`[StreamManager] Q&A saved to database for chat: ${chatId}`);

      // 3. Remove from active streams
      useStreamStore.getState().removeStream(chatId);

      // 4. Notify all registered callbacks
      this.completionCallbacks.forEach((callback) => {
        callback(chatId, query, answer);
      });

      // 5. Show notification if this was a background stream
      if (!isCurrentChat) {
        toast.success('Response ready!', {
          description: 'Click to view the completed analysis',
          action: {
            label: 'View',
            onClick: () => {
              // This will be handled by the callback in Dashboard
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
