import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Edit, Check, X, Youtube, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import useCall from "../../hooks/useCall.js";
import ThreeDotLoader from "./ThreeDotLoader.jsx";
import {
  createNewChat,
  getVideoTranscript,
  updateChat,
} from "../../api/chats.js";
import {
  addNewChat,
  initializeCurrentChat,
  updateCurrentChat,
  updateIsTranscriptGenerated,
} from "../../features/chatsSlice.js";
import { isValidYouTubeUrlOrId } from "../../helpers/chatHelpers.js";



const UrlInput = () => {
  const dispatch = useDispatch();
  const currentChat = useSelector((s) => s.chats.currentChat);
  const { youtubeVideoUrl, videoId, selectedChatId, isTranscriptGenerated } =
    currentChat || {};

  const isChatSelected = !!selectedChatId;

  const [videoURL, setVideoURL] = useState(youtubeVideoUrl || "");
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const lastUpdateRequestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setVideoURL(youtubeVideoUrl || "");
  }, [youtubeVideoUrl]);

  const { handleApiCall: handleApiCallCreateNewChat } = useCall(
    createNewChat,
    "Creating new chat"
  );

  const {
    isLoading: isLoadingFetch,
    loadingMsg: loadingMsgFetch,
    isError: isErrorFetch,
    errorMsg: errorMsgFetch,
    setIsError: setIsErrorFetch,
    setIsLoading: setIsLoadingFetch,
    handleApiCall: handleApiCallFetch,
  } = useCall(getVideoTranscript, "Loading transcript");

  const {
    isLoading: isLoadingUpdate,
    loadingMsg: loadingMsgUpdate,
    isError: isErrorUpdate,
    errorMsg: errorMsgUpdate,
    setIsError: setIsErrorUpdate,
    setIsLoading: setIsLoadingUpdate,
    handleApiCall: handleApiCallUpdate,
  } = useCall(updateChat, "Saving video URL");

  const isAnyLoading = isLoadingFetch || isLoadingUpdate;
  const isAnyError = isErrorFetch || isErrorUpdate;

  // Clear temporary messages
  useEffect(() => {
    if (localError || successMessage) {
      const timer = setTimeout(() => {
        setLocalError("");
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [localError, successMessage]);

  // Reset errors/loaders on chat change
  useEffect(() => {
    setIsErrorFetch(false);
    setIsErrorUpdate(false);
    setIsLoadingFetch(false);
    setIsLoadingUpdate(false);
  }, [
    selectedChatId,
    videoId,
    setIsErrorFetch,
    setIsErrorUpdate,
    setIsLoadingFetch,
    setIsLoadingUpdate,
  ]);

  // Fetch transcript automatically when videoId changes
  useEffect(() => {
    if (!videoId || isTranscriptGenerated) return;

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      try {
        const response = await handleApiCallFetch([videoId], { signal });

        if (response && response.success) {
          dispatch(updateIsTranscriptGenerated(true));
          setSuccessMessage("Video loaded successfully!");
          setIsEditing(false);
        } else {
          dispatch(updateIsTranscriptGenerated(false));
          setLocalError("Failed to fetch transcript. You can edit and retry.");
          setIsEditing(true);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setLocalError("Error loading transcript. Edit and retry.");
        dispatch(updateIsTranscriptGenerated(false));
        setIsEditing(true);
      }
    };

    run();
    return () => controller.abort();
  }, [videoId, isTranscriptGenerated, handleApiCallFetch, dispatch]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalError("");
      setSuccessMessage("");

      const trimmed = (videoURL || "").trim();

      if (!trimmed) {
        setLocalError("Please enter a YouTube URL or ID");
        return;
      }

      if (!isValidYouTubeUrlOrId(trimmed)) {
        setLocalError("Invalid YouTube URL or ID");
        return;
      }

      // Skip API if same URL and transcript exists
      if (
        (youtubeVideoUrl || "").trim() === trimmed &&
        isTranscriptGenerated
      ) {
        setIsEditing(false);
        setSuccessMessage("Transcript already available. No reload needed.");
        return;
      }

      // Create new chat if none selected
      if (!isChatSelected) {
        const chatData = { title: "New Chat", youtubeVideoUrl: trimmed };
        const response = await handleApiCallCreateNewChat([chatData]);

        if (response.success) {
          const newChatData = response.data;
          dispatch(addNewChat(newChatData));
          newChatData.type = "newchat";
          dispatch(initializeCurrentChat(newChatData));
          setSuccessMessage("New chat created. Loading video...");
        } else {
          setLocalError(response.data?.message || "Failed to create chat");
        }
        return;
      }

      // Update existing chat with new URL
      lastUpdateRequestRef.current += 1;
      const requestId = lastUpdateRequestRef.current;
      const payload = { youtubeVideoUrl: trimmed };
      const updateResponse = await handleApiCallUpdate([
        selectedChatId,
        payload,
      ]);

      if (!mountedRef.current || requestId !== lastUpdateRequestRef.current)
        return;

      if (!updateResponse.success) {
        setLocalError(updateResponse.data?.message || "Failed to update URL");
        return;
      }

      dispatch(updateCurrentChat(updateResponse.data));
      setIsEditing(false);
      setSuccessMessage("URL saved. Loading video...");
      dispatch(updateIsTranscriptGenerated(false));
    },
    [
      videoURL,
      selectedChatId,
      youtubeVideoUrl,
      isTranscriptGenerated,
      isChatSelected,
      handleApiCallCreateNewChat,
      handleApiCallUpdate,
      dispatch,
    ]
  );

  const handleEdit = () => {
    setIsEditing(true);
    setLocalError("");
    setSuccessMessage("");
  };

  // Input/button logic
  const urlTrimmed = videoURL.trim();
  const isDifferentUrl = urlTrimmed !== (youtubeVideoUrl || "").trim();

  const inputDisabled = isAnyLoading || (isTranscriptGenerated && !isEditing);
  const canEdit =
    isTranscriptGenerated && !isEditing && !isAnyLoading && !isAnyError;

  const canSave =
    urlTrimmed.length > 0 &&
    ((isAnyError && isDifferentUrl) ||
      (!isAnyError && (isEditing || !isTranscriptGenerated))) &&
    !isAnyLoading;

  return (
    <div className="w-[70%] mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex w-full gap-1.5">
          <div className="relative flex-1 group">
            <Youtube className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none" />
            <input
              aria-label="YouTube URL"
              type="text"
              value={videoURL}
              onChange={(e) => setVideoURL(e.target.value)}
              placeholder="Enter YouTube URL or ID"
              disabled={inputDisabled}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl
                         bg-gray-800/60 backdrop-blur-sm
                         text-white placeholder-gray-500 
                         border border-gray-700/50
                         shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all duration-200
                         hover:bg-gray-800/80 hover:border-gray-600/50
                         ${inputDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
            />
          </div>

          <button
            type="submit"
            disabled={!canSave}
            title={
              isTranscriptGenerated && !isEditing
                ? "Click Edit to change URL"
                : "Save URL and generate transcript"
            }
            className={`rounded-xl px-2.5 py-2 shadow-md flex items-center justify-center 
                       transition-all duration-200 transform hover:scale-105 active:scale-95
                       ${canSave
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/20"
                : "bg-gray-700/60 cursor-not-allowed text-gray-500"
              }`}
          >
            {isTranscriptGenerated && !isEditing ? (
              <Check size={16} />
            ) : (
              <FileText size={16} />
            )}
          </button>

          <button
            type="button"
            onClick={handleEdit}
            disabled={!canEdit}
            title={
              canEdit
                ? "Edit URL to change it"
                : "Already editing or no transcript yet"
            }
            className={`rounded-xl px-2.5 py-2 shadow-md flex items-center justify-center 
                       transition-all duration-200 transform hover:scale-105 active:scale-95
                       ${canEdit
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20"
                : "bg-gray-700/60 cursor-not-allowed text-gray-500"
              }`}
          >
            <Edit size={16} />
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setVideoURL(youtubeVideoUrl || "");
                setIsEditing(false);
                setLocalError("");
                setSuccessMessage("Edit cancelled");
              }}
              className="rounded-xl px-2.5 py-2 shadow-md flex items-center justify-center 
                         bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 
                         text-white transition-all duration-200 transform hover:scale-105 active:scale-95
                         shadow-red-500/20 animate-slide-in"
              title="Cancel editing"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Messages */}
        {isAnyLoading && (
          <div className="text-blue-300 text-xs p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-2 items-center backdrop-blur-sm animate-fade-in">
            <ThreeDotLoader />
            <span className="font-medium">
              {isLoadingFetch ? loadingMsgFetch : loadingMsgUpdate}
            </span>
          </div>
        )}

        {isAnyError && (
          <div className="text-red-300 text-xs p-2.5 bg-red-900/20 rounded-xl border border-red-500/30 flex gap-2 items-start backdrop-blur-sm animate-shake">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Error:</strong>{" "}
              {isErrorFetch ? errorMsgFetch : errorMsgUpdate}
            </div>
          </div>
        )}

        {!isAnyLoading && localError && (
          <div className="text-red-300 text-xs p-2.5 bg-red-900/20 rounded-xl border border-red-500/30 flex gap-2 items-start backdrop-blur-sm animate-shake">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Error:</strong> {localError}
            </div>
          </div>
        )}

        {!isAnyLoading && successMessage && (
          <div className="text-green-300 text-xs p-2.5 bg-green-900/20 rounded-xl border border-green-500/30 flex gap-2 items-center backdrop-blur-sm animate-fade-in">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default UrlInput;
