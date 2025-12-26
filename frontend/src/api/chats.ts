import client from './client';
import type { ApiResponse, Chat, ChatData, QA } from '../types';
import type { CreateChatSchema, SaveQASchema, UpdateChatSchema } from '../types/chats.api';


export const chatApi = {
  createChat: async (data: CreateChatSchema) => {
    return client.post<ApiResponse<Chat>>('/chats/newchat', data);
  },
  getAllChats: async () => {
    return client.get<ApiResponse<Chat[]>>('/chats/allchats');
  },
  updateChat: async (chatUid: string, data: UpdateChatSchema) => {
    return client.put<ApiResponse<Chat>>(`/chats/updatechat/${chatUid}`, data);
  },
  deleteChat: async (chatUid: string) => {
    return client.delete(`/chats/delete/${chatUid}`);
  },
  getChatData: async (chatUid: string) => {
    return client.get<ApiResponse<ChatData>>(`/chats/chat/${chatUid}`);
  },
  createQA: async (chatUid: string, data: SaveQASchema) => {
    return client.post<ApiResponse<QA>>(`/chats/newqa/${chatUid}`, data);
  },
  fetchAndStoreVideo: async (videoId: string) => {
    return client.post(`/chats/video/${videoId}`);
  },

  getLLMResponse: async (videoId: string, query: string) => {
    // Note: The docs defined this as GET /chats/response/{video_id}/{query}
    // passing query in path might be tricky if it has special chars. Ideally query params.
    // I'll stick to the docs but URI encode it.
    return client.get(`/chats/response/${videoId}/${encodeURIComponent(query)}`);
  },
};
