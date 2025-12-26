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
  // Function to update the user information and authentication status
  setAuth: (user: User | null) => void;
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

      // Action to set authentication data
      setAuth: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      // Action to clear authentication data
      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      // Unique name for the localStorage key
      name: 'chattube-auth-storage',
    }
  )
);
