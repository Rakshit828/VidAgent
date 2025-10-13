import { createSlice } from "@reduxjs/toolkit";
import { snakeKeysToCamel } from "../helpers/chatHelpers";

export const initialState = {
    accessToken: "",
};

export const selectAccessToken = state => state.auth.accessToken

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
        }
    },
});


export const { setAccessToken } = authSlice.actions;
export default authSlice.reducer;
