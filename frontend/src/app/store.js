import { configureStore } from "@reduxjs/toolkit";
import authReducer, { initialState as authInitialState } from "../features/authSlice.js";
import chatReducer from "../features/chatsSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chats: chatReducer
  }
});
