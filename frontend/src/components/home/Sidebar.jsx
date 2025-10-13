import { ArrowLeftCircle, PenBox, X, Menu } from "lucide-react";
import appLogo from "../../assets/appLogo.png";
import SidebarContent from "./SidebarContent";
import NewChatModal from "./NewChatModal";
import { useState } from "react";
import CollectionUrl from "./CollectionUrl";
import LogoutButton from "./LogoutButton";
import { userLogOut } from "../../api/auth";
import useApiCall from "../../hooks/useApiCall";
import { useNavigate } from "react-router-dom";


const Sidebar = ({ sidebar, setSidebar, isMobile }) => {
  const [isChatModelOpen, setIsChatModelOpen] = useState(false);
  const navigate = useNavigate()
  const handleCreateNewChat = () => {
    setIsChatModelOpen(true);
  };

  const onChatModelClose = () => {
    setIsChatModelOpen(false);
  };

  const {
    isLoading: isLogoutLoading,
    handleApiCall: handleApiCallLogout,
  } = useApiCall(userLogOut, "", false)

  return (
    <>
      <NewChatModal onClose={onChatModelClose} isOpen={isChatModelOpen} />

      {/* Overlay on mobile */}
      {isMobile && sidebar && (
        <div
          className="fixed top-0 left-64 right-0 bottom-0 z-40 bg-black/50 backdrop-blur-sm 
                     animate-fade-in"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`
          ${isMobile ? "fixed top-0 left-0 h-screen z-50" : "relative h-screen"}
          flex flex-col backdrop-blur-xl 
          bg-gradient-to-br from-gray-950/98 via-gray-900/95 to-gray-950/98
          border-r border-gray-800/50 shadow-2xl
          transition-[width,transform] duration-500 ease-in-out
          ${isMobile
            ? sidebar
              ? "translate-x-0 w-64 max-w-[80%]"
              : "-translate-x-full w-64 max-w-[80%]"
            : sidebar
              ? "flex-none w-64"
              : "flex-none w-16"
          }
        `}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        {/* Header */}
        <div
          className={`relative flex w-full h-16 items-center border-b border-gray-800/50 backdrop-blur-sm ${sidebar ? "justify-between px-4" : "justify-center"
            }`}
        >
          {sidebar && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="relative">
                <img
                  src={appLogo}
                  alt="App Logo"
                  className="w-10 h-10 object-contain drop-shadow-lg"
                />
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full -z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight">ChatTube</span>
                <span className="text-xs text-gray-500">AI Assistant</span>
              </div>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={() => setSidebar(!sidebar)}
              className="group relative p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 
                         transition-all duration-300 transform hover:scale-110 active:scale-95
                         border border-gray-700/50 hover:border-gray-600/50"
            >
              <ArrowLeftCircle
                size={20}
                className={`text-gray-300 group-hover:text-white transition-all duration-300 ${sidebar ? "" : "rotate-180"
                  }`}
              />
            </button>
          )}

          {isMobile && sidebar && (
            <button
              onClick={() => setSidebar(false)}
              className="group p-2 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 
                         transition-all duration-300 transform hover:scale-110 active:scale-95
                         border border-gray-700/50 hover:border-gray-600/50"
            >
              <X
                size={20}
                className="text-gray-300 group-hover:text-white transition-colors"
              />
            </button>
          )}
        </div>

        <CollectionUrl sidebar={sidebar} />

        {/* Sidebar content */}
        <SidebarContent
          sidebar={sidebar}
          isMobile={isMobile}
          handleCreateNewChat={handleCreateNewChat}
          onClose={onChatModelClose}
        />

        <LogoutButton
          sidebar={sidebar}
          onLogout={async () => {
            await handleApiCallLogout([])
            navigate("/login", { replace: true })
          }}
          isLoading={isLogoutLoading}
        />
      </div>

      {/* Mobile navbar when sidebar closed */}
      {isMobile && !sidebar && (
        <div
          className="fixed top-0 left-0 w-full h-16 z-50 
                     bg-gray-950/98 backdrop-blur-xl border-b border-gray-800/50 
                     flex items-center justify-between px-4 text-white shadow-2xl
                     animate-slide-down"
        >
          <button
            onClick={() => setSidebar(true)}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl 
                       bg-gray-800/60 hover:bg-gray-700/80 
                       transition-all duration-300 transform hover:scale-105 active:scale-95
                       border border-gray-700/50 hover:border-gray-600/50"
          >
            <Menu size={20} className="text-gray-300 group-hover:text-white transition-colors" />
            <span className="font-medium text-sm">Menu</span>
          </button>

          <button
            id="new-project-navbar"
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl
                       bg-gradient-to-r from-blue-600 to-purple-600 
                       hover:from-blue-500 hover:to-purple-500 
                       active:from-blue-700 active:to-purple-700
                       transition-all duration-300 transform hover:scale-105 active:scale-95
                       shadow-lg hover:shadow-xl hover:shadow-blue-500/25
                       border border-blue-500/20"
            onClick={handleCreateNewChat}
          >
            <PenBox size={18} className="text-white" />
            <span className="text-sm font-semibold">New Chat</span>
          </button>
        </div>
      )}

    </>
  );
};

export default Sidebar;