import { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAccessToken,
  setAccessToken,
} from "../features/authSlice";
import { handleRefreshToken } from "../api/auth.js";
import { useNavigate } from "react-router-dom";


const useStreaming = (onChunk) => {

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate()

  const accessToken = useSelector((state) => selectAccessToken(state));
  const dispatch = useDispatch();
  

  const refreshAccessToken = useCallback(async () => {
    const response = await handleRefreshToken();
    if (response.success) return response.data;
    if (
      response.data?.error === "expired_jwt_token_error" &&
      response.status_code === 401
    ) {
      navigate("/login", { replace: true })
      throw new Error("Session expired. Please login again.");
    }
    throw new Error("Failed to refresh token");
  });

  
  // --- Perform the streaming fetch ---
  const performStream = useCallback(async (url, token, options = {}) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "text/plain",
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    return response;
  }, []);

  // --- Stream data with auto token refresh ---
  const streamData = useCallback(
    async (url, options = {}) => {
      setIsStreaming(true);
      setError(null);

      try {
        let token = accessToken;
        let response = await performStream(url, token, options);

        // Handle 401 with token refresh
        if (response.status === 401) {
          const newAccessTokenObj = await refreshAccessToken();
          const newAccessToken =
            newAccessTokenObj.access_token ||
            newAccessTokenObj.accessToken ||
            newAccessTokenObj;

          dispatch(setAccessToken(newAccessToken));
          token = newAccessToken;
          response = await performStream(url, token, options);
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          
          // Call onChunk callback if provided
          if (onChunk) {
            onChunk(accumulatedText);
          }
        }

        // CRITICAL: Call onChunk one final time with complete text
        // This ensures the final state is captured before isStreaming becomes false
        if (onChunk) {
          onChunk(accumulatedText);
        }

        // Set streaming to false AFTER final callback
        setIsStreaming(false);
        return { success: true, data: accumulatedText };
        
      } catch (err) {
        // Set streaming to false on error
        setIsStreaming(false);

        if (err.name === "AbortError") {
          return { success: false, error: "Request cancelled", aborted: true };
        }
        console.error("Streaming error:", err);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        abortControllerRef.current = null;
      }
    },
    [accessToken, refreshAccessToken, dispatch, onChunk, performStream]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setIsStreaming(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { isStreaming, error, streamData, abort, reset };
};

export default useStreaming;