import { useState, useCallback, useMemo } from "react";

function useCall(apiFunction, loadingMessage = "") {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessage);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleApiCall = useCallback(
    async (apiParameters = [], options = {}) => {
      setErrorMsg("");
      setIsError(false);
      setIsLoading(true);
      setLoadingMsg(loadingMessage);

      const response = await apiFunction(...apiParameters, options);

      if (!response.success) {
        setIsLoading(false);
        setIsError(true);
        setErrorMsg(response.data?.message || "Unexpected error occurred");
        setLoadingMsg("");
        return response;
      }

      setIsLoading(false);
      setLoadingMsg("");
      return response;
    },
    [apiFunction, loadingMessage]
  );

  // ✅ Memoize return object to stabilize references
  return useMemo(() => ({
    isLoading,
    setIsLoading,
    loadingMsg,
    setLoadingMsg,
    isError,
    setIsError,
    errorMsg,
    setErrorMsg,
    handleApiCall,
  }), [isLoading, loadingMsg, isError, errorMsg, handleApiCall]);

}

export default useCall;
