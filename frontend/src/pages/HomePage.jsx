import { useState, useEffect } from "react";
import Sidebar from "../components/ui/Sidebar.jsx";
import ChatArea from "../components/ui/ChatArea.jsx";
import PersistentRoundedSidebar from "../components/ui/RightSidebar.jsx";

const HomePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Sidebar
        sidebar={sidebarOpen}
        setSidebar={setSidebarOpen}
        isMobile={isMobile}
      />
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <ChatArea />
      </div>
      {/* <PersistentRoundedSidebar /> */}
    </div>
  );
};

export default HomePage;
