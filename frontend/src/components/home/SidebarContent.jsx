import { useEffect } from "react";
import { PenBox, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import useCall from "../../hooks/useCall";
import { loadAllChats } from "../../api/chats";
import { initializeUserChats } from "../../features/chatsSlice";
import ThreeDotLoader from "./ThreeDotLoader";
import Chat from "./Chat.jsx";
import { selectAccessToken } from "../../features/authSlice.js";


const SidebarContent = ({ sidebar, isMobile, handleCreateNewChat }) => {
  const userChats = useSelector((state) => state.chats.userChats);
  const currentChat = useSelector((state) => state.chats.currentChat);
  const accessToken = useSelector(selectAccessToken)

  const { selectedChatId } = currentChat || {};

  const dispatch = useDispatch();

  const { isLoading, isError, errorMsg, loadingMsg, handleApiCall } = useCall(
    loadAllChats,
    "Loading Chats"
  );

  useEffect(() => {
    if (!(accessToken?.length > 0)) {
      return
    }
    const handleLoadAllChats = async () => {
      const response = await handleApiCall([]);
      if (response.success && !isError) {
        dispatch(initializeUserChats(response.data));
      }
    };

    handleLoadAllChats();
  }, [accessToken, isError, handleApiCall, dispatch]);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto relative z-0 custom-dark-scrollbar px-3 py-2">
      {/* New Chat button */}
      <div
        id="new-chat"
        className={`
          relative group flex items-center rounded-2xl cursor-pointer overflow-hidden
          ${sidebar ? "justify-start px-5 gap-3 h-14" : "justify-center h-12"}
          bg-gradient-to-r from-blue-600 to-purple-600 
          hover:from-blue-500 hover:to-purple-500 
          active:from-blue-700 active:to-purple-700
          transform hover:scale-[1.02] active:scale-[0.98]
          transition-all duration-300 ease-out
          shadow-lg hover:shadow-xl hover:shadow-blue-500/25
        `}
        onClick={handleCreateNewChat}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
                        translate-x-[-100%] group-hover:translate-x-[100%] 
                        transition-transform duration-700 ease-in-out" />

        <PenBox size={20} className="text-white relative z-10 transform group-hover:rotate-12 transition-transform duration-300" />
        {sidebar && (
          <span className="font-semibold text-sm tracking-wide text-white relative z-10">
            New Chat
          </span>
        )}
        {sidebar && (
          <Sparkles size={16} className="text-white/80 ml-auto relative z-10 animate-pulse-slow" />
        )}
      </div>

      {/* Recent Chats */}
      {(sidebar || isMobile) && (
        <div
          id="chats"
          className="w-full mt-6 text-gray-400 overflow-y-auto space-y-2 custom-dark-scrollbar"
        >
          <div className="text-xs uppercase font-bold text-gray-500 mb-3 tracking-wider px-2 flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
            Recent Chats
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
              <div className="bg-gray-800/60 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50">
                <ThreeDotLoader />
                {loadingMsg && (
                  <p className="text-xs mt-3 text-gray-400 text-center">{loadingMsg}</p>
                )}
              </div>
            </div>
          )}

          {isError && (
            <div className="text-red-300 text-sm p-4 bg-gradient-to-br from-red-900/30 to-red-800/20 
                            rounded-2xl shadow-lg border border-red-700/30 backdrop-blur-sm animate-shake">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                {errorMsg}
              </div>
            </div>
          )}

          {!isLoading && !isError && userChats?.length > 0 ? (
            <div className="space-y-1.5">
              {userChats.map((chat, index) => (
                <div
                  key={chat.uuid}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Chat
                    chatID={chat.uuid}
                    chatTitle={chat.title}
                    isSelected={selectedChatId === chat.uuid}
                    dispatch={dispatch}
                  />
                </div>
              ))}
            </div>
          ) : (
            !isLoading &&
            !isError && (
              <div className="text-gray-500 text-sm text-center py-8 px-4 animate-fade-in">
                <div className="bg-gray-800/40 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/30">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <PenBox className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-400">No chats yet</p>
                  <p className="text-xs text-gray-600 mt-1">Start a new conversation</p>
                </div>
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
};

export default SidebarContent;