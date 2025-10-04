import { ArrowLeftCircle, PenBox, X } from "lucide-react";
import appLogo from "../../assets/appLogo.png";
import SidebarContent from "./SidebarContent";
import NewChatModal from "./NewChatModal";
import { useState } from "react";


const Sidebar = ({ sidebar, setSidebar, isMobile }) => {
  console.log("Rendering from sidebar")
  const [isChatModelOpen, setIsChatModelOpen] = useState(false)
  

  const handleCreateNewChat = (event) => {
    setIsChatModelOpen(true)
  }

  const onChatModelClose = () => {
    setIsChatModelOpen(false)
  }


  return (
    <>
      <NewChatModal onClose={onChatModelClose} isOpen={isChatModelOpen} />
      {/* Overlay on mobile */}
      {isMobile && sidebar && (
        <div
          className="fixed top-0 left-64 right-0 bottom-0 z-40"
          onClick={() => setSidebar(false)}
        />
      )}



      {/* Sidebar container */}
      <div
        className={`
          ${isMobile ? "fixed top-0 left-0 h-screen z-50" : "relative h-screen"}
          flex flex-col bg-black overflow-auto
          transition-all duration-300 ease-in-out
          ${isMobile
            ? sidebar
              ? "translate-x-0 w-64 max-w-[80%]"
              : "-translate-x-full w-64 max-w-[80%]"
            : sidebar
              ? "flex-none w-64"
              : "flex-none w-14"
          }
        `}
      >
        {/* Header */}
        <div
          className={`flex w-full h-12 sm:h-14 items-center ${sidebar ? "justify-between px-3" : "justify-center"
            }`}
        >
          {sidebar && <img src={appLogo} alt="App Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />}

          {!isMobile && (
            <ArrowLeftCircle
              color="white"
              size={24}
              className={`hover:opacity-70 cursor-pointer transition-all duration-200 ${sidebar ? "" : "rotate-180"
                }`}
              onClick={() => setSidebar(!sidebar)}
            />
          )}

          {isMobile && sidebar && (
            <X
              color="white"
              size={24}
              className="hover:opacity-70 cursor-pointer transition-all duration-200"
              onClick={() => setSidebar(false)}
            />
          )}
        </div>

        {/* Sidebar content */}
        <SidebarContent 
          sidebar={sidebar} 
          isMobile={isMobile} 
          handleCreateNewChat={handleCreateNewChat}
          onClose={onChatModelClose}
        />

      </div>

      {/* Mobile navbar when sidebar closed - OUTSIDE the sidebar container */}
      {isMobile && !sidebar && (
        <div
          className="fixed top-0 left-0 w-full h-12 sm:h-14 z-50 
                     bg-gray-900 text-white flex items-center justify-between px-4 
                     shadow-md"
        >
          {/* Sidebar open button */}
          <button
            onClick={() => setSidebar(true)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeftCircle size={24} className="rotate-180" />
            <span className="font-medium">Menu</span>
          </button>

          {/* New project button */}
          <button
            id="new-project-navbar"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 
                       px-3 py-1.5 rounded-lg transition-colors"
            onClick={handleCreateNewChat}
          >
            <PenBox size={18} />
            <span className="text-sm">New Chat</span>
          </button>
        </div>
      )}
    </>
  );
};

export default Sidebar;
