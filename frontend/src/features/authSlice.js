import { createSlice } from "@reduxjs/toolkit";
import { snakeKeysToCamel } from "../helpers/chatHelpers";

export const initialState = {
    accessToken: "",
    currentEmail: "",
    requiresRelogin: false,
};

export const selectAccessToken = state => state.auth.accessToken
export const selectEmail = state => state.auth.currentEmail

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAccessToken: (state, action) => {
            action.payload = snakeKeysToCamel(action.payload);
            state.accessToken = action.payload.accessToken
        },

        clearTokens: (state) => {
            state.accessToken = ""
        },

        setCurrentEmail: (state, action) => {
            state.currentEmail = action.payload.email
        },

        setRequiresRelogin: (state, action) => {
            state.requiresRelogin = action.payload
        }
    },
});


export const { setAccessToken, setCurrentEmail, clearPassword, setRequiresRelogin } = authSlice.actions;
export default authSlice.reducer;
