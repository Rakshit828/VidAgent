import axios from 'axios';

// Track if a refresh is currently in progress to avoid multiple calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create Axios Instance
const client = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor
client.interceptors.response.use(
  (response) => {
    // Backend standardizes on status: 'success' or 'error' in JSON
    if (response.data && response.data.status === 'error') {
      // Reject so it enters the error handler, but keep it identifiable
      return Promise.reject({
        ...response.data,
        isBusinessError: true,
        response // Keep reference if needed
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Detect 401 from either HTTP status OR business status in a rejected promise
    const statusCode = error.response?.status || error.status_code;

    // 1. Handle 401 Unauthorized (Expired Token)
    if (statusCode === 401 && !originalRequest._retry) {
      
      // Prevent loops for recursion-prone endpoints
      const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');
      if (isAuthRequest) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request if a refresh is already in progress
        return new Promise((resolve) => {
          failedQueue.push({ 
            resolve: () => resolve(client(originalRequest)), 
            reject: (err) => Promise.reject(err) 
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Step 1: Attempt to refresh the access token via HttpOnly cookie
        await client.get('/auth/refresh');
        
        // Step 2: Refresh successful! Resolve the queue
        processQueue(null);
        
        // Step 3: Retry the original request
        return client(originalRequest);
      } catch (refreshError: any) {
        // Step 4: Refresh failed (e.g., refresh token expired)
        processQueue(refreshError);
        
        // Optional: you could force a redirect here if needed
        // window.location.href = '/login';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // 2. Normalize standard Axios Errors or Business Errors
    // If it's already normalized by us (has status, message, status_code), just pass it
    if (error.status === 'error' && error.message) {
        return Promise.reject(error);
    }

    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({
        status: 'error',
        message: message,
        status_code: statusCode || 500,
        error: error.response?.data?.error || error.code || 'unknown_error'
    });
  }
);

export default client;
