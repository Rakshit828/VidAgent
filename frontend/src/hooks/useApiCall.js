import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAccessToken, selectRefreshToken, setAccessToken } from "../features/authSlice";
import { handleRefreshToken } from "../api/auth.js";

function useApiCall(apiFunction, loadingMessage = "", requiresHeader = true) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessage);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const accessToken = useSelector(selectAccessToken);
  const refreshToken = useSelector(selectRefreshToken);

  const dispatch = useDispatch();

  const handleTokenRefresh = async () => {
    // Returns { access_token: "dfadfsdufadf" } if successful
    const header = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${refreshToken}`
    };
    console.log("Header for refresh ", header);
    
    const response = await handleRefreshToken(header);
    if (response.success) {
      return response.data;
    }
    if (response.data?.error === "expired_jwt_token_error" && response.status_code === 401) {
      throw new Error("Session expired. Please login again.");
      // Logic to redirect to login page is remaining
    }
    throw new Error("Failed to refresh token");
    // Logic to redirect to login page is remaining
  };

  const makeApiCallWithToken = async (token, apiParameters) => {
    const header = requiresHeader
      ? {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      : undefined;

    console.log("Header for access ", header);
    const response = await apiFunction(...apiParameters, header);
    return response
  };
  
  const handleApiCall = useCallback(async (apiParameters = []) => {
    setErrorMsg("");
    setIsError(false);
    setIsLoading(true);
    setLoadingMsg(loadingMessage);

    try {
      // First attempt with current access token
      console.log("First api call parameters ", apiParameters)
      let response = await makeApiCallWithToken(accessToken, apiParameters);
      
      console.log("Response of first api call (any) ", response)

      // Handle expired access token
      if (!response.success && response.data?.error?.trim() === "expired_jwt_token_error" && response.status_code === 401) {
        // Refresh token and retry same api
        setLoadingMsg("Verifying User");
        const accessTokenObj = await handleTokenRefresh();
        dispatch(setAccessToken(accessTokenObj));
        
        // Get the new access token value
        const newAccessToken = accessTokenObj.access_token || accessTokenObj.accessToken || accessTokenObj;
        
        // Retry the original API call with new token
        response = await makeApiCallWithToken(newAccessToken, apiParameters);
      }

      // Check final response
      if (!response.success) {
        setIsLoading(false);
        setIsError(true);
        setErrorMsg(response.data?.message || "An error occurred");
        setLoadingMsg("");
        return response;
      }

      // Success case
      setIsLoading(false);
      setLoadingMsg("");
      return response

    } catch (error) {
      console.error("API Call Error:", error);
      setIsLoading(false);
      setIsError(true);
      setErrorMsg(error.message || "An unexpected error occurred");
      setLoadingMsg("");
      return { success: false, data: null };
    }
  }, [accessToken, refreshToken, apiFunction, loadingMessage, requiresHeader, dispatch]);

  
  return {
    isLoading,
    setIsLoading,
    loadingMsg,
    setLoadingMsg,
    isError,
    setIsError,
    errorMsg,
    setErrorMsg,
    handleApiCall
  };
}

export default useApiCall;