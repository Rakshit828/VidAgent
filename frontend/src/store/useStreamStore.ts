import { create } from 'zustand';

/**
 * Represents the state of an active stream for a specific chat
 */
export interface StreamState {
  chatId: string;
  streamingMessageId: string;
  agentStatus: string;
  statusMessage: string;
  isActive: boolean;
  query: string;
  startedAt: Date;
  videoId: string;
}

/**
 * Store interface for managing multiple concurrent streams
 */
interface StreamStore {
  // Map of chatId -> StreamState
  activeStreams: Map<string, StreamState>;
  
  // Actions
  addStream: (chatId: string, state: Omit<StreamState, 'chatId' | 'isActive' | 'startedAt'>) => void;
  updateStreamStatus: (chatId: string, status: string, statusMessage: string) => void;
  removeStream: (chatId: string) => void;
  getStream: (chatId: string) => StreamState | undefined;
  hasActiveStream: (chatId: string) => boolean;
  getAllActiveStreams: () => StreamState[];
  clearAllStreams: () => void;
}

/**
 * Global store for managing streaming state across all chats.
 * Allows streams to continue in the background when switching between chats.
 */
export const useStreamStore = create<StreamStore>((set, get) => ({
  activeStreams: new Map(),

  addStream: (chatId, state) => {
    set((store) => {
      const newStreams = new Map(store.activeStreams);
      newStreams.set(chatId, {
        ...state,
        chatId,
        isActive: true,
        startedAt: new Date(),
      });
      return { activeStreams: newStreams };
    });
  },

  updateStreamStatus: (chatId, status, statusMessage) => {
    set((store) => {
      const newStreams = new Map(store.activeStreams);
      const existingStream = newStreams.get(chatId);
      
      if (existingStream) {
        newStreams.set(chatId, {
          ...existingStream,
          agentStatus: status,
          statusMessage,
        });
      }
      
      return { activeStreams: newStreams };
    });
  },

  removeStream: (chatId) => {
    set((store) => {
      const newStreams = new Map(store.activeStreams);
      newStreams.delete(chatId);
      return { activeStreams: newStreams };
    });
  },

  getStream: (chatId) => {
    return get().activeStreams.get(chatId);
  },

  hasActiveStream: (chatId) => {
    return get().activeStreams.has(chatId);
  },

  getAllActiveStreams: () => {
    return Array.from(get().activeStreams.values());
  },

  clearAllStreams: () => {
    set({ activeStreams: new Map() });
  },
}));
