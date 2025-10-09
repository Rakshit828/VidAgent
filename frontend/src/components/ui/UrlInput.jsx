import React, { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Edit, Check, X, Youtube, AlertCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import useApiCall from '../../hooks/useApiCall.js';
import ThreeDotLoader from './ThreeDotLoader';
import { createNewChat, getVideoTranscript, updateChat } from "../../api/chats";
import { addNewChat, initializeCurrentChat, setIsTranscriptGeneratedToTrue, updateCurrentChat } from "../../features/chatsSlice.js";
import { isValidYouTubeUrlOrId } from "../../helpers/chatHelpers.js";


const UrlInput = () => {
  const dispatch = useDispatch();
  const currentChat = useSelector((s) => s.chats.currentChat);
  const { youtubeVideoUrl, videoId, selectedChatId, isTranscriptGenerated } = currentChat || {};

  const isChatSelected = !!selectedChatId

  const [videoURL, setVideoURL] = useState(youtubeVideoUrl || "");
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const lastFetchRequestRef = useRef(0);
  const lastUpdateRequestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setVideoURL(youtubeVideoUrl || "");
  }, [youtubeVideoUrl]);


  const {
    handleApiCall: handleApiCallCreateNewChat
  } = useApiCall(createNewChat, "Creating new chat")

  const {
    isLoading: isLoadingFetch,
    loadingMsg: loadingMsgFetch,
    isError: isErrorFetch,
    errorMsg: errorMsgFetch,
    setIsError: setIsErrorFetch,
    handleApiCall: handleApiCallFetch,
  } = useApiCall(getVideoTranscript, "Loading transcript");

  const {
    isLoading: isLoadingUpdate,
    loadingMsg: loadingMsgUpdate,
    isError: isErrorUpdate,
    errorMsg: errorMsgUpdate,
    setIsError: setIsErrorUpdate,
    handleApiCall: handleApiCallUpdate
  } = useApiCall(updateChat, "Saving video URL");


  const isAnyLoading = isLoadingFetch || isLoadingUpdate;
  const isAnyError = isErrorFetch || isErrorUpdate;

  // Clear messages after 3 seconds
  useEffect(() => {
    if (localError || successMessage) {
      const timer = setTimeout(() => {
        setLocalError("");
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [localError, successMessage]);


  // To clear error messages when current chat changes
  useEffect(() => {
    setIsErrorFetch(false)
    setIsErrorUpdate(false)
  }, [selectedChatId, videoId])


  // Fetch transcript when videoId changes and transcript not yet generated
  useEffect(() => {
    const run = async () => {
      if (!videoId || isTranscriptGenerated) return;

      lastFetchRequestRef.current += 1;
      const requestId = lastFetchRequestRef.current;

      const response = await handleApiCallFetch([videoId]);
      if (!mountedRef.current || requestId !== lastFetchRequestRef.current) return;

      if (response && response.success) {
        dispatch(setIsTranscriptGeneratedToTrue());
        setSuccessMessage("Video Loaded successfully!");
      }
    };
    run();
  }, [videoId, isTranscriptGenerated, handleApiCallFetch, dispatch]);

  const handleSubmit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();

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

    if ((youtubeVideoUrl || "").trim() === trimmed) {
      setIsEditing(false);
      setSuccessMessage("No changes to save");
      return;
    }


    // To create a new chat
    if (!isChatSelected) {
      const chatData = {
        title: "New Chat",
        youtubeVideoUrl: trimmed
      }
      const response = await handleApiCallCreateNewChat([chatData])
      if (response.success) {
        const newChatData = response.data
        dispatch(addNewChat(newChatData))
        newChatData.type = "newchat"
        dispatch(initializeCurrentChat(newChatData))
      }
      return;
    }

    lastUpdateRequestRef.current += 1;
    const requestId = lastUpdateRequestRef.current;

    const payload = { youtubeVideoUrl: trimmed };
    const updateResponse = await handleApiCallUpdate([selectedChatId, payload]);

    if (!mountedRef.current || requestId !== lastUpdateRequestRef.current) return;

    if (!updateResponse.success) {
      setLocalError(updateResponse.data?.message || "Failed to update URL");
      return;
    }

    if (updateResponse.success) {
      dispatch(updateCurrentChat(updateResponse.data));
      setIsEditing(false);
      setSuccessMessage("URL saved successfully!");
    }
  }, [videoURL, selectedChatId, youtubeVideoUrl, handleApiCallUpdate, dispatch]);

  const handleEdit = () => {
    setIsEditing(true);
    setLocalError("");
    setSuccessMessage("");
  };

  // Logic for disabling/enabling input and buttons
  const urlTrimmed = videoURL.trim();
  const isDifferentUrl = urlTrimmed !== (youtubeVideoUrl || "").trim();
  const inputDisabled = (isTranscriptGenerated && !isEditing) || isAnyLoading;
  const canEdit = isTranscriptGenerated && !isEditing && !isAnyLoading;

  // Save button logic
  const canSave =
    urlTrimmed.length > 0 &&
    (
      // Case 1: error exists and URL is different -> allow save
      (isAnyError && isDifferentUrl) ||
      // Case 2: normal case -> editing OR transcript not yet generated
      (!isAnyError && (isEditing || !isTranscriptGenerated))
    ) &&
    !isAnyLoading;


  return (
    <div className="w-[70%]">
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
                         ${inputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <button
            type="submit"
            disabled={!canSave}
            title={isTranscriptGenerated && !isEditing ? "Click Edit to change URL" : "Save URL and generate transcript"}
            className={`rounded-xl px-2.5 py-2 shadow-md flex items-center justify-center 
                       transition-all duration-200 transform hover:scale-105 active:scale-95
                       ${canSave 
                         ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-500/20' 
                         : 'bg-gray-700/60 cursor-not-allowed text-gray-500'}`}
          >
            {isTranscriptGenerated && !isEditing ? <Check size={16} /> : <FileText size={16} />}
          </button>

          <button
            type="button"
            onClick={handleEdit}
            disabled={!canEdit}
            title={canEdit ? "Edit URL to change it" : "Already editing or no transcript yet"}
            className={`rounded-xl px-2.5 py-2 shadow-md flex items-center justify-center 
                       transition-all duration-200 transform hover:scale-105 active:scale-95
                       ${canEdit 
                         ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20' 
                         : 'bg-gray-700/60 cursor-not-allowed text-gray-500'}`}
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
          <div className="text-blue-300 text-xs p-2.5 bg-blue-500/10 rounded-xl
                          border border-blue-500/20 flex gap-2 items-center backdrop-blur-sm
                          animate-fade-in">
            <ThreeDotLoader />
            <span className="font-medium">{isLoadingFetch ? loadingMsgFetch : loadingMsgUpdate}</span>
          </div>
        )}

        {isAnyError && (
          <div className="text-red-300 text-xs p-2.5 bg-red-900/20 rounded-xl
                          border border-red-500/30 flex gap-2 items-start backdrop-blur-sm
                          animate-shake">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Error:</strong> {isErrorFetch ? errorMsgFetch : errorMsgUpdate}
            </div>
          </div>
        )}

        {!isAnyLoading && (localError) && (
          <div className="text-red-300 text-xs p-2.5 bg-red-900/20 rounded-xl
                          border border-red-500/30 flex gap-2 items-start backdrop-blur-sm
                          animate-shake">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-semibold">Error:</strong> {localError}
            </div>
          </div>
        )}

        {!isAnyLoading && successMessage && (
          <div className="text-green-300 text-xs p-2.5 bg-green-900/20 rounded-xl
                          border border-green-500/30 flex gap-2 items-center backdrop-blur-sm
                          animate-fade-in">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}
      </form>

    </div>
  );
};

export default UrlInput;