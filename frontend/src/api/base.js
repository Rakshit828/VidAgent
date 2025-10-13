export const BASE_URL = "http://localhost:8000";
export const VERSION = 'v1';
export const CHATS_PREFIX = `/api/${VERSION}/chats`;
export const AUTH_PREFIX = `/api/${VERSION}/auth`;


// Centralized response/error handler
export const handleRequest = async (axiosCall) => {
    try {
        const response = await axiosCall()
        return { success: true, data: response.data }
        // Here data is the pure data/json returned from the server
    } catch (error) {
        const statusCode = error.response?.status
        const detail = error.response?.data?.detail || error.response?.detail || error.message 
        // The schema of the detail is:
        // { error: "expired_token_error", message: "JWT token has expired "}

        return {
            success: false,
            status_code: statusCode,
            data: detail
        }
    }
}
