import { useRef, useEffect, useState } from "react";
import InputFieldsWrapper from "./InputFieldsWrapper.jsx";
import ChatInput from "./ChatInput.jsx";
import UrlInput from "./UrlInput.jsx";
import FormattedResponse from "./FormattedResponse.jsx";
import { User, Bot, Play } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addNewQuestionsAnswers, updateLastAnswer } from "../../features/chatsSlice.js";
import ThreeDotLoader from "./ThreeDotLoader.jsx";
import useApiCall from "../../hooks/useApiCall.js";
import { createNewQA, getResponseFromLLM } from "../../api/chats.js";


const ChatArea = () => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  const currentChat = useSelector(state => state.chats.currentChat);
  const { selectedChatId, videoId, embedUrl, questionsAnswers } = currentChat;

  const [query, setQuery] = useState("");

  const dispatch = useDispatch();

  const {
    isLoading: isLoadingResponse,
    loadingMsg: loadingMsgResponse,
    isError: isErrorResponse,
    errorMsg: errorMsgResponse,
    handleApiCall: handleApiCallResponse
  } = useApiCall(getResponseFromLLM, "Thinking");

  const {
    isLoading: isLoadingSave,
    loadingMsg: loadingMsgSave,
    isError: isErrorSave,
    errorMsg: errorMsgSave,
    handleApiCall: handleApiCallSave
  } = useApiCall(createNewQA)


  const handleGetResponse = async () => {
    const currentQuery = query.trim();

    if (!currentQuery) return;

    // Step 1: Add the question to Redux (with empty answer)
    dispatch(addNewQuestionsAnswers({
      query: currentQuery,
      chatUID: selectedChatId
    }));

    // Step 2: Get response from LLM
    const response = await handleApiCallResponse([videoId, currentQuery]);

    const answerText = response.success && response.data
      ? response.data
      : `Error: ${errorMsgResponse || "Failed to get response"}`;

    // Step 3: Update the answer in Redux
    dispatch(updateLastAnswer({
      answer: answerText,
      chatUID: selectedChatId
    }));

    // Step 4: Save to database
    if (response.success) {
      await handleSaveQA(currentQuery, answerText);
    }
  };


  const handleSaveQA = async (questionText, answerText) => {
    const qaData = {
      query: questionText,
      answer: answerText,
      chat_uid: selectedChatId
    }

    const response = await handleApiCallSave([qaData]);

    if (response.success) {
      console.log("QA saved successfully to database");
    } else {
      console.error("Failed to save QA:", errorMsgSave);
    }
  }

  const scrollToBottom = (smooth = true) => {
    const container = chatContainerRef.current;
    if (!container) return;
    const top = container.scrollHeight - container.clientHeight;
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    } else {
      container.scrollTop = top;
    }
  };


  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    const timer = setTimeout(() => scrollToBottom(true), 50);
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

            {/* Landing page */}
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

            {/* Video embed */}
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

            {/* Questions & Answers */}
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
                        {!qa.answer && isLoadingResponse && index === questionsAnswers.length - 1 ? (
                          <div className="flex items-center gap-2 text-blue-400">
                            {loadingMsgResponse} <ThreeDotLoader size={10} />
                          </div>
                        ) : !qa.answer && !isLoadingResponse && index === questionsAnswers.length - 1 ? (
                          <div className="text-yellow-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                            Waiting for response...
                          </div>
                        ) : qa.answer ? (
                          <FormattedResponse text={qa.answer} />
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
            isResponseLoading={isLoadingResponse}
            isDisabled={true}
          />
        </InputFieldsWrapper>
      </div>


      {/* Footer */}
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6 pb-2">
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatArea;