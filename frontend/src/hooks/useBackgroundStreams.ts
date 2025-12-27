import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStreamStore } from '../store/useStreamStore';
import { streamManager } from '../services/streamManager';

/**
 * Hook to manage background streams and their completion handlers.
 * This hook should be used at the app/dashboard level to handle streams
 * that complete while the user is viewing a different chat.
 * 
 * @param currentChatId - The currently active chat ID
 * @returns Object with active stream information and control functions
 */
export const useBackgroundStreams = (currentChatId?: string) => {
  const queryClient = useQueryClient();
  const activeStreamsMap = useStreamStore((state) => state.activeStreams);
  const activeStreams = Array.from(activeStreamsMap.values());
  const hasActiveStreams = activeStreams.length > 0;
  const activeStreamCount = activeStreams.length;

  // Initialize stream manager with query client
  useEffect(() => {
    streamManager.initialize(queryClient);
  }, [queryClient]);

  // Get streams for other chats (background streams)
  const backgroundStreams = activeStreams.filter(
    (stream) => stream.chatId !== currentChatId
  );

  // Get stream for current chat if any
  const currentChatStream = activeStreams.find(
    (stream) => stream.chatId === currentChatId
  );

  return {
    activeStreams,
    backgroundStreams,
    currentChatStream,
    hasActiveStreams,
    activeStreamCount,
    backgroundStreamCount: backgroundStreams.length,
  };
};
