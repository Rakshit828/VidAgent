import axios from "axios";
import { getAccessTokenHelper, setAccessTokenHelper, setRequiresReloginHelper } from '../app/store.js'
import { handleTokenRefresh } from "./auth.js";

export const BASE_URL = 'http://localhost:8000';
export const VERSION = 'v1';
export const CHATS_PREFIX = `/api/${VERSION}/chats`;
export const AUTH_PREFIX = `/api/${VERSION}/auth`;


export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Accept': 'application/json' }
})


api.interceptors.request.use(
    function onFullfilled(config) {
        if (config.url.includes(AUTH_PREFIX)) {
            return config;
        }

        const token = getAccessTokenHelper() || ""
        console.log("Access token: ", token)
        config.headers.Authorization = `Bearer ${token}`
        return config
    }
)


api.interceptors.response.use(
    function onFullfilled(response) {
        return { success: true, data: response.data }
    },

    async function onRejected(error) {
        const originalRequest = error.config;

        if (!originalRequest) {
            console.error("No config in error:", error);
            return {
                success: false,
                status_code: null,
                data: error.message || "Network or configuration error",
            };
        }

        const statusCode = error.response?.status;
        const detail = error.response?.data?.detail || error.message;

        // prevent infinite loop on refresh token failure
        if (originalRequest.url.includes(`${AUTH_PREFIX}/refresh`)) {
            return { success: false };
        }

        if (
            statusCode === 401 &&
            (detail?.error === "expired_access_token_error" ||
                detail?.error === "invalid_jwt_token_error")
        ) {
            const refreshResponse = await handleTokenRefresh();

            if (!refreshResponse.success) {
                setRequiresReloginHelper(true)
                return;
            }

            // store new access token
            const newAccessToken = refreshResponse.data;
            setAccessTokenHelper(newAccessToken);

            // retry the failed request with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            const retryResponse = await api(originalRequest);
            return retryResponse;
        }

        return {
            success: false,
            status_code: statusCode,
            data: detail,
        };
    }
)