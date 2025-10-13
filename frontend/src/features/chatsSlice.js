import { createSlice } from "@reduxjs/toolkit";
import { snakeKeysToCamel, getYouTubeEmbedUrl, getYouTubeVideoId } from "../helpers/chatHelpers";

export const initialState = {
  userChats: [], // A list of objects with keys: uuid, title, youtube_video_url
  currentChat: {
    youtubeVideoUrl: "",
    selectedChatId: "",
    videoId: "",
    embedUrl: "",
    isTranscriptGenerated: "",
    questionsAnswers: []
  }
}

export const chatsSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    initializeUserChats: (state, action) => {
      const payload = snakeKeysToCamel(action.payload)
      state.userChats = payload
      state.userChats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    deleteUserChat: (state, action) => {
      const payload = snakeKeysToCamel(action.payload)
      state.userChats = state.userChats.filter((chat) => chat.uuid !== payload.uuid)
    },

    updateUserChats: (state, action) => {
      const payload = snakeKeysToCamel(action.payload)
      const chatUUID = payload?.uuid
      const chat = state.userChats.find(chat => chat.uuid === chatUUID)

      if (chat) {
        chat.title = payload?.title
        chat.youtube_video_url = payload?.youtubeVideoUrl
      }
    },

    addNewChat: (state, action) => {
      const payload = snakeKeysToCamel(action.payload)
      state.userChats.unshift(payload)
    },

    initializeCurrentChat: (state, action = {}) => {
      //To check for empty object
      if (typeof action.payload === 'object' && Object.keys(action.payload).length === 0) {
        state.currentChat = initialState.currentChat
        return;
      }
      const payload = snakeKeysToCamel(action.payload)
      if(action.payload?.type === 'newchat'){
        payload['selectedChatId'] = payload.uuid
        payload['isTranscriptGenerated'] = false
        payload['questionsAnswers'] = []
      }
      payload['embedUrl'] = getYouTubeEmbedUrl(payload.youtubeVideoUrl)
      payload['videoId'] = getYouTubeVideoId(payload.youtubeVideoUrl)
      state.currentChat = payload
 
    },

    // Add a new Q&A entry (used when user sends a question)
    addNewQuestionsAnswers: (state, action) => {
      const { query, chatUID } = action.payload

      if (state.currentChat.selectedChatId === chatUID) {
        state.currentChat.questionsAnswers.push({
          query: query,
          answer: "" // Initially empty, will be updated when response arrives
        })
      }
    },

    // Update the answer for the last Q&A entry
    updateLastAnswer: (state, action) => {
      const { answer, chatUID } = action.payload

      if (state.currentChat.selectedChatId === chatUID &&
        state.currentChat.questionsAnswers.length > 0) {
        const lastIndex = state.currentChat.questionsAnswers.length - 1
        state.currentChat.questionsAnswers[lastIndex].answer = answer
      }
    },

    setIsTranscriptGeneratedToTrue: (state, action) => {
      state.currentChat.isTranscriptGenerated = action.payload ?? true;
    },

    updateCurrentChat: (state, action) => {
      const payload = snakeKeysToCamel(action.payload)
      state.currentChat.selectedChatId = payload.uuid
      state.currentChat.youtubeVideoUrl = payload.youtubeVideoUrl
      state.currentChat.embedUrl = getYouTubeEmbedUrl(payload.youtubeVideoUrl)
      state.currentChat.videoId = getYouTubeVideoId(payload.youtubeVideoUrl) 
      state.currentChat.isTranscriptGenerated = false 
    }
  }
})

export const {
  initializeCurrentChat,
  initializeUserChats,
  addNewChat,
  addNewQuestionsAnswers,
  updateLastAnswer,
  setIsTranscriptGeneratedToTrue,
  updateCurrentChat,
  deleteUserChat,
  updateUserChats
} = chatsSlice.actions

export default chatsSlice.reducer