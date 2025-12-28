import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { extractYouTubeId } from '../../lib/utils';
import { chatApi } from '../../api/chats';
// Types are implicitly handled or can be added if needed
import { toast } from 'sonner';

import { useAuthStore } from '../../store/useAuthStore';


export const useChats = () => {
  const { isNewUser, isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.getAllChats().then(res => res.data),
    // Only fetch if authenticated and not a brand new user
    enabled: isAuthenticated && !isNewUser,
  });
};

/**
 * Hook to fetch data for a specific chat.
 */
export const useChatData = (chatId?: string) => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: ['chat-data', chatId],
    queryFn: () => chatId ? chatApi.getChatData(chatId).then(res => res.data) : null,
    // Only fetch if authenticated and we have a chatId
    enabled: isAuthenticated && !!chatId,
  });
};

/**
 * Hook to create a new chat and process the video.
 */
export const useCreateAndProcessChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, onStatusChange }: { url: string, onStatusChange?: (status: string) => void }) => {
      // Step 1: Create the Chat
      if (onStatusChange) onStatusChange("Creating New Chat...");
      const createRes = await chatApi.createChat({ 
        youtubeVideoUrl: url,
        title: "New Analysis" // Default title, can be updated later
      });
      const newChat = createRes.data.data;
      
      // Step 2: Extract video ID and fetch/store video
      if (onStatusChange) onStatusChange("Loading Video...");
      const videoId = extractYouTubeId(url);
      if (!videoId) throw new Error("Invalid YouTube URL");

      await chatApi.fetchAndStoreVideo(videoId);
      
      return newChat;
    },
    onSuccess: () => {
      // If the user was marked as new, they now have at least one chat
      const { setIsNewUser } = useAuthStore.getState();
      setIsNewUser(false);
      
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to initiate chat");
    }
  });
};

/**
 * Hook to update chat title (rename).
 */
export const useUpdateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string, title: string }) => 
      chatApi.updateChat(id, { title }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success("Chat renamed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to rename chat");
    }
  });
};

/**
 * Hook to delete a chat.
 */
export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatApi.deleteChat(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success("Chat deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete chat");
    }
  });
};

/**
 * Hook to delete all QA for a chat.
 */
export const useDeleteChatQA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatApi.deleteAllQA(id).then(res => res.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['chat-data', id] });
      toast.success("Conversation cleared");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to clear conversation");
    }
  });
};

