import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Create Axios Instance
const client = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response Interceptor for handling 401s
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // specific check for 401 and avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token
        await client.get('/auth/refresh');
        // Retry the original request
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login or clear state
        console.error('Refresh token failed:', refreshError);
        // Optional: window.location.href = '/login'; // Or use a callback
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
