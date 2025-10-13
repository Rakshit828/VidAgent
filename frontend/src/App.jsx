import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import { handleRefreshToken } from "./api/auth.js";
import { selectAccessToken, setAccessToken } from "./features/authSlice.js";
import "./App.css";

const LoadingSpinner = () => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "1.2rem"
  }}>
    <div>Loading...</div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const accessToken = useSelector(selectAccessToken);
  const [authChecked, setAuthChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      // If token exists in Redux, allow access
      if (accessToken) {
        setAllowed(true);
        setAuthChecked(true);
        return;
      }

      // Try to refresh using cookie
      try {
        const response = await handleRefreshToken();

        if (response.success && response.data?.access_token) {
          dispatch(setAccessToken(response.data));
          setAllowed(true);
        } else {
          console.log("Token refresh failed:", response.data);
          setAllowed(false);
        }
      } catch (error) {
        console.error("Error during token refresh:", error);
        setAllowed(false);
      } finally {
        setAuthChecked(true);
      }
    };

    verifyToken();
  }, [accessToken, dispatch]);

  if (!authChecked) {
    return <LoadingSpinner />;
  }

  return allowed ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;