import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import type { LoginFormData, SignupFormData } from '../../types/auth.api';
import { toast } from 'sonner';

/**
 * Custom hook for User Registration (Signup).
 * Uses TanStack Query Mutation to handle the POST request.
 */
export const useSignup = () => {
  return useMutation({
    // The actual API call function
    mutationFn: (data: SignupFormData) => authApi.signup(data).then(res => res.data),
    
    // Success callback
    onSuccess: (response) => {
      // Displaying the success message from the backend
      toast.success(response.message || 'Account created successfully!');
    },
    
    // Error callback
    onError: (error: any) => {
      // Displaying the normalized error message from our interceptor
      toast.error(error.message || 'Signup failed. Please try again.');
    }
  });
};

/**
 * Custom hook for User Login.
 * Handles the login request and updates the Zustand store upon success.
 */
export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  
  return useMutation({
    // Mutation function for login
    mutationFn: (data: LoginFormData) => authApi.login(data).then(res => res.data),
    
    onSuccess: (response) => {
      // Update our global session state in Zustand
      if (response.data && 'user' in response.data) {
          setAuth(response.data.user as any);
      }
      // Displaying the success message from the backend
      toast.success(response.message || 'Logged in successfully!');
    },
    
    onError: (error: any) => {
      // Displaying the normalized error message from our interceptor
      toast.error(error.message || 'Invalid credentials.');
    }
  });
};

/**
 * Custom hook for User Logout.
 * Calls the backend to clear cookies/sessions and clears the Zustand store.
 */
export const useLogout = () => {
  const logoutLocal = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout().then(res => res.data),
    
    onSuccess: (response) => {
      // Clear global user state
      logoutLocal();
      // Clear all cached queries to ensure no data from previous user remains
      queryClient.clear();
      // Displaying the success message from the backend
      toast.success(response.message || 'Logged out successfully!');
    },

    onError: (error: any) => {
        toast.error(error.message || 'Logout failed.');
    }
  });
};

/**
 * Custom hook to fetch and synchronize the current user's profile.
 * Useful for restoring sessions on page reload.
 */
export const useUser = () => {
    const { setAuth } = useAuthStore();

    return useQuery({
        // Unique key for caching the user profile
        queryKey: ['user-profile'],

        // Function that fetches the profile
        queryFn: () => authApi.getMyProfile().then(res => {
            // v5 way to sync state on success
            if (res.data?.data) {
                setAuth(res.data.data as any);
            }
            return res.data;
        }),

        // 1. Critical: Stop retrying if we get a 401/error (e.g. on login page)
        retry: false,
        
        // 2. Only fetch if we are likely to have a session (optional optimization)
        // enabled: !!localStorage.getItem('chattube-auth-storage'), 
    });
};
