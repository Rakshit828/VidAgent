import { useRef, useEffect } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useSelector } from "react-redux";

const ChatInput = ({
  query,
  setQuery,
  generateResponse,
  isResponseLoading,
}) => {

  const { selectedChatId } = useSelector(state => state.chats.currentChat)

  const isChatSelected = !!selectedChatId

  const textareaRef = useRef(null);

  const handleSendQueries = async (event) => {
    event?.preventDefault();

    // Prevent sending if already loading or query is empty
    if (!query.trim()) return;

    const textarea = textareaRef.current;
    // lock current height to prevent immediate layout jump when we clear query
    if (textarea) textarea.style.height = `${textarea.clientHeight}px`;

    await generateResponse();

    setQuery("");
    // release height next frame so the auto-resize useEffect can recalc without a jump
    requestAnimationFrame(() => {
      if (textarea) textarea.style.height = "auto";
    });
  };


  // auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 150; // px
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [query]);


  // Enter to send, Shift+Enter to newline
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey ) {
      e.preventDefault();
      handleSendQueries();
    }
  };


  return (
    <div className="w-full">
      <form
        onSubmit={handleSendQueries}
        className="relative group bg-gradient-to-r from-gray-800/80 to-gray-700/80 
                   backdrop-blur-xl rounded-3xl flex items-center p-1.5 gap-2 sm:gap-3
                   border border-gray-700/50 shadow-2xl
                   transition-all duration-300
                   hover:border-gray-600/50 hover:shadow-blue-900/10"
        aria-label="Chat input form"
      >
        {/* Decorative gradient line on focus */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-focus-within:opacity-100 
                        transition-opacity duration-300 pointer-events-none
                        bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10" />

        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={!isChatSelected ? "Enter a video to start chatting..." : "Type a message..."}
          rows={1}
          disabled={!isChatSelected}
          className="flex-1 resize-none bg-transparent text-white rounded-3xl 
                     px-3 sm:px-4 py-2.5 sm:py-3 min-w-0
                     leading-[1.5] text-sm sm:text-base 
                     focus:outline-none 
                     custom-dark-scrollbar
                     placeholder-gray-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-opacity duration-200"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={isResponseLoading || !query.trim()}
          className="relative group/btn bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                     p-2.5 sm:p-3.5 
                     rounded-full flex items-center justify-center 
                     hover:from-blue-500 hover:to-purple-500
                     active:from-blue-700 active:to-purple-700
                     transition-all duration-200
                     transform hover:scale-110 active:scale-95
                     disabled:from-gray-600 disabled:to-gray-600
                     disabled:cursor-not-allowed disabled:transform-none
                     shadow-lg hover:shadow-xl hover:shadow-blue-500/25
                     overflow-hidden"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
                          translate-x-[-100%] group-hover/btn:translate-x-[100%] 
                          transition-transform duration-700 ease-in-out" />

          <PaperAirplaneIcon className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 
                                         transition-transform duration-200
                                         ${isResponseLoading ? 'animate-pulse' : 'group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5'}`} />
        </button>
      </form>

    </div>
  );
};

export default ChatInput;