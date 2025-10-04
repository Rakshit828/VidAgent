import { useRef, useEffect, useState } from "react";
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
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden w-full relative">
      <div className="flex-1 flex flex-col min-h-0 w-full">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain scroll-smooth custom-dark-scrollbar pb-32"
        >
          <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6">

            {/* Landing page */}
            {(!questionsAnswers || questionsAnswers.length === 0) && !embedUrl && (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
                <div className="w-12 h-12 sm:w-16 md:w-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Bot className="w-6 h-6 sm:w-8 md:w-10 text-gray-400" />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white mb-3">
                  Your New Youtube Companion
                </h2>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-medium text-gray-200">
                  Ask | Learn | Chat
                </h1>
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gradient mt-2">
                  ChatTube AI
                </h1>
              </div>
            )}

            {/* Video embed */}
            {embedUrl && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Play className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-gray-300">Video Content</span>
                </div>
                <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-gray-800 border border-gray-700">
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
                  <div key={index} className="space-y-4 pb-6 border-b border-gray-800 last:border-b-0 last:pb-0">
                    {/* User query */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-base text-gray-100 leading-relaxed break-words word-break-break-all">
                        <strong className="text-2xl">{qa.query}</strong>
                      </div>
                    </div>

                    {/* Bot answer */}
                    <div className="flex items-start gap-3 mb-0">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-gray-300" />
                      </div>
                      <div className="flex-1 text-base text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
                        {!qa.answer && isLoadingResponse && index === questionsAnswers.length - 1 ? (
                          <div className="flex items-center gap-2">
                            {loadingMsgResponse} <ThreeDotLoader size={10} />
                          </div>
                        ) : !qa.answer && !isLoadingResponse && index === questionsAnswers.length - 1 ? (
                          <div className="text-yellow-500">Waiting for response...</div>
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

      {/* Inputs */}
      <div className="sticky bottom-0 w-full z-20 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-2 sm:px-4 lg:px-6 pt-1.5">
          <UrlInput />
          <ChatInput
            query={query}
            setQuery={setQuery}
            generateResponse={handleGetResponse}
            isLoading={isLoadingResponse}
            isDisabled={true}
          />
        </div>
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