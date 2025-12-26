import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * ProtectedRoute Component.
 * Checks the Zustand store for authentication status.
 * If the user is authenticated, it renders the child routes (Outlet).
 * If not, it redirects to the login page.
 */
const ProtectedRoute = () => {
    // Accessing authentication state from our Zustand store
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the platform/dashboard sections
    return <Outlet />;
};

export default ProtectedRoute;
