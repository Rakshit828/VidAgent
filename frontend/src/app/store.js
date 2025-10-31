import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice.js";
import chatReducer from "../features/chatsSlice.js";
import { setRequiresRelogin, setAccessToken } from "../features/authSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chats: chatReducer
  }
});



// Helper functions

export function getAccessTokenHelper() {
  return store.getState().auth.accessToken
}

export function setRequiresReloginHelper(value){
  store.dispatch(setRequiresRelogin(value))
}

export function setAccessTokenHelper(payload){
  store.dispatch(setAccessToken(payload))
}