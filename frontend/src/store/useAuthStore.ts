import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

/**
 * Interface representing the state and actions for our Authentication Store.
 */
interface AuthState {
  // The current logged-in user, or null if not authenticated
  user: User | null;
  // Boolean flag to quickly check if the user is logged in
  isAuthenticated: boolean;
  // Flag to track if the initial session check has been performed
  isInitialized: boolean;
  // Flag to track if this is a newly registered user (to skip initial API calls)
  isNewUser: boolean;
  // Function to update the user information and authentication status
  setAuth: (user: User | null, isNewUser?: boolean) => void;
  // Function to manually set the isNewUser flag
  setIsNewUser: (isNew: boolean) => void;
  // Function to clear the user information and log out (locally)
  logout: () => void;
}

/**
 * Zustand store to manage user authentication state.
 * Using 'persist' middleware to save the user state in localStorage,
 * allowing the session to persist across page reloads.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isNewUser: false,

      // Action to set authentication data
      setAuth: (user, isNewUser = false) => set({ 
        user, 
        isAuthenticated: !!user,
        isInitialized: true,
        isNewUser
      }),

      // Action to set isNewUser flag explicitly
      setIsNewUser: (isNew) => set({ isNewUser: isNew }),

      // Action to clear authentication data
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        isInitialized: true, // We have completed our session state transition
        isNewUser: false
      }),
    }),
    {
      // Unique name for the localStorage key
      name: 'chattube-auth-storage',
      // Only persist user data and authentication status. 
      // 'isNewUser' and 'isInitialized' should NOT be persisted.
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
