import { useRef, useEffect, useState } from "react";
import InputFieldsWrapper from "./InputFieldsWrapper.jsx";
import ChatInput from "./ChatInput.jsx";
import UrlInput from "./UrlInput.jsx";
import FormattedResponse from "./FormattedResponse.jsx";
import { User, Bot, Play } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addNewQuestionsAnswers, updateLastAnswer } from "../../features/chatsSlice.js";
import ThreeDotLoader from "./ThreeDotLoader.jsx";
import useCall from "../../hooks/useCall.js";
import { createNewQA } from "../../api/chats.js";
import useStreaming from "../../hooks/useStreaming.js";
import { BASE_URL, CHATS_PREFIX } from "../../api/base.js";
import React from "react";


const ChatArea = () => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const currentChat = useSelector(state => state.chats.currentChat);
  const { selectedChatId, videoId, embedUrl, questionsAnswers } = currentChat;

  const [query, setQuery] = useState("");
  const dispatch = useDispatch();

  const {
    isLoading: isLoadingSave,
    errorMsg: errorMsgSave,
    handleApiCall: handleApiCallSave
  } = useCall(createNewQA);

  const bufferRef = useRef("");

  const { isStreaming, error: streamError, streamData } = useStreaming(
    (accumulatedText) => {
      bufferRef.current = accumulatedText;
    }
  );

  // --- Throttle streaming updates to Redux ---
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      if (bufferRef.current) {
        dispatch(updateLastAnswer({
          answer: bufferRef.current,
          chatUID: selectedChatId
        }));
      }
    }, 150); // update every 150ms

    return () => clearInterval(interval);
  }, [isStreaming, selectedChatId, dispatch]);


  // --- CRITICAL FIX: Dispatch final complete text when streaming stops ---
  useEffect(() => {
    // When streaming transitions from true to false, dispatch the final buffer
    if (!isStreaming && bufferRef.current) {
      dispatch(updateLastAnswer({
        answer: bufferRef.current,
        chatUID: selectedChatId
      }));
    }
  }, [isStreaming, selectedChatId, dispatch]);

  const handleGetResponse = async () => {
    const currentQuery = query.trim();
    if (!currentQuery || isStreaming) return;
    setQuery("");

    // Clear buffer for new query
    bufferRef.current = "";

    dispatch(addNewQuestionsAnswers({
      query: currentQuery,
      chatUID: selectedChatId
    }));

    const apiUrl = `${BASE_URL}${CHATS_PREFIX}/response/${videoId}/${encodeURIComponent(currentQuery)}`;
    const response = await streamData(apiUrl);

    if (!response.success) {
      const errorText = `Error: ${response.error || "Failed to get response"}`;
      dispatch(updateLastAnswer({
        answer: errorText,
        chatUID: selectedChatId
      }));
      return;
    }

    // Save the complete response data
    await handleSaveQA(currentQuery, response.data);
  };

  const handleSaveQA = async (questionText, answerText) => {
    const qaData = {
      query: questionText,
      answer: answerText,
      chat_uid: selectedChatId
    };

    const response = await handleApiCallSave([qaData]);
    if (response.success) {
      console.log("QA saved successfully to database");
    } else {
      console.error("Failed to save QA:", errorMsgSave);
    }
  };

  // --- Optimized scroll handler ---
  const scrollToBottom = (smooth = true) => {
    const container = chatContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    });
  };

  // --- Throttle scroll during streaming ---
  useEffect(() => {
    if (!isStreaming) return;
    const handle = setInterval(() => scrollToBottom(false), 200);
    return () => clearInterval(handle);
  }, [isStreaming]);

  // --- Smooth scroll when messages update ---
  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    const timer = setTimeout(() => scrollToBottom(true), 80);
    return () => clearTimeout(timer);
  }, [questionsAnswers]);


  
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden w-full relative">
      <div className="flex-1 flex flex-col min-h-0 w-full">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain scroll-smooth custom-dark-scrollbar pb-32"
        >
          <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">

            {/* Landing Page */}
            {(!questionsAnswers || questionsAnswers.length === 0) && !embedUrl && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 animate-fade-in">
                <div className="w-12 h-12 sm:w-16 md:w-20 bg-gradient-to-br from-gray-800 to-gray-700 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse-slow">
                  <Bot className="w-6 h-6 sm:w-8 md:w-10 text-blue-400" />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-gray-300 mb-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  Your New Youtube Companion
                </h2>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium text-gray-100 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  Ask | Learn | Chat
                </h1>
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mt-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  ChatTube AI
                </h1>
              </div>
            )}

            {/* Video Embed */}
            {embedUrl && (
              <div className="mb-8 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-red-500" fill="currentColor" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Video Content</span>
                </div>
                <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-gray-800 border border-gray-700/50 transition-all duration-300 hover:shadow-blue-900/20 hover:border-gray-600">
                  <div className="aspect-video">
                    <iframe
                      src={embedUrl}
                      title="YouTube Video"
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {questionsAnswers && questionsAnswers.length > 0 && (
              <div className="space-y-8">
                {questionsAnswers.map((qa, index) => (
                  <div key={index} className="space-y-4 pb-6 border-b border-gray-800/50 last:border-b-0 last:pb-0 animate-fade-in-up">
                    {/* User query */}
                    <div className="flex w-full justify-end">
                      <div className="flex items-start gap-3 max-w-[75%] group">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rounded-tr-sm px-4 py-2.5 text-base text-white leading-relaxed break-words shadow-lg transform transition-all duration-200 hover:shadow-blue-500/25 hover:scale-[1.02]">
                          {qa.query}
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-blue-500/20">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Bot answer */}
                    <div className="flex items-start gap-3 mb-0 group">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-gray-600/20">
                        <Bot className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 text-base text-gray-200 leading-relaxed break-words whitespace-pre-wrap bg-gray-800/40 rounded-2xl rounded-tl-sm px-4 py-3 backdrop-blur-sm border border-gray-700/30 transition-all duration-200 hover:bg-gray-800/60 hover:border-gray-600/50">
                        {!qa.answer && isStreaming && index === questionsAnswers.length - 1 ? (
                          <div className="flex items-center gap-2 text-blue-400">
                            <span className="animate-pulse">Thinking</span>
                            <ThreeDotLoader size={10} />
                          </div>
                        ) : !qa.answer && !isStreaming && index === questionsAnswers.length - 1 ? (
                          <div className="text-yellow-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                            Waiting for response...
                          </div>
                        ) : qa.answer ? (
                          <MemoFormattedResponse text={qa.answer} />
                        ) : (
                          <div className="text-gray-500">No response yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent backdrop-blur-md">
        <InputFieldsWrapper>
          <UrlInput />
          <ChatInput
            query={query}
            setQuery={setQuery}
            generateResponse={handleGetResponse}
            isResponseLoading={isStreaming}
            isDisabled={!videoId || isStreaming}
          />
        </InputFieldsWrapper>
      </div>

      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6 pb-2">
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};


const MemoFormattedResponse = React.memo(FormattedResponse);

export default ChatArea;