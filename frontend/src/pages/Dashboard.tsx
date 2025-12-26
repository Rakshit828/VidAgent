import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { MOCK_CHATS, MOCK_MESSAGES } from '../mock/data';
import type { MockChat, MockMessage } from '../mock/data';
import { Menu } from 'lucide-react';
import { Button } from '../components/ui/button-shadcn';
import { cn } from '../lib/utils';

// Global mock state to persist between route changes in this demo
let GLOBAL_CHATS = [...MOCK_CHATS];
const GLOBAL_MESSAGES: Record<string, MockMessage[]> = {
    '1': [...MOCK_MESSAGES]
};

const Dashboard = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();

    const [chats, setChats] = useState<MockChat[]>(GLOBAL_CHATS);
    const [messages, setMessages] = useState<MockMessage[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Sync messages based on chatId
    useEffect(() => {
        if (chatId) {
            const chatExists = chats.find(c => c.id === chatId);
            if (chatExists) {
                setMessages(GLOBAL_MESSAGES[chatId] || []);
            } else {
                // If chat doesn't exist, redirect home
                navigate('/', { replace: true });
            }
        } else {
            setMessages([]);
        }
    }, [chatId, chats, navigate]);

    const handleCreateChat = (title: string, url: string) => {
        const id = Date.now().toString();
        const newChat: MockChat = {
            id,
            title,
            timestamp: new Date()
        };

        const updatedChats = [newChat, ...chats];
        GLOBAL_CHATS = updatedChats;
        setChats(updatedChats);

        // Mock initial conversation
        GLOBAL_MESSAGES[id] = [{
            id: 'sys-1',
            role: 'assistant',
            content: `I'm ready to analyze ${url}. Ask me anything about the video content!`,
            timestamp: 'Now'
        }];

        setIsSidebarOpen(false);
        navigate(`/chat/${id}`);
    };

    const handleDeleteChat = (id: string) => {
        if (window.confirm("Delete this chat?")) {
            const updatedChats = chats.filter(c => c.id !== id);
            GLOBAL_CHATS = updatedChats;
            setChats(updatedChats);
            delete GLOBAL_MESSAGES[id];

            if (chatId === id) {
                navigate('/');
            }
        }
    };

    const handleRenameChat = (id: string, newTitle: string) => {
        const updatedChats = chats.map(c => c.id === id ? { ...c, title: newTitle } : c);
        GLOBAL_CHATS = updatedChats;
        setChats(updatedChats);
    };

    const handleSelectChat = (id: string) => {
        navigate(`/chat/${id}`);
        setIsSidebarOpen(false);
    };

    const handleSendMessage = (text: string) => {
        if (!chatId) {
            // If on home screen, creating a new chat from the URL input
            handleCreateChat("New Video Analysis", text);
            return;
        }

        const newMsg: MockMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: 'Now'
        };

        const updatedMessages = [...messages, newMsg];
        GLOBAL_MESSAGES[chatId] = updatedMessages;
        setMessages(updatedMessages);

        setIsLoading(true);

        setTimeout(() => {
            const responseMsg: MockMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "This is a mock response. The backend is not connected in this UI demo.",
                timestamp: 'Now'
            };
            const finalMessages = [...updatedMessages, responseMsg];
            GLOBAL_MESSAGES[chatId] = finalMessages;
            setMessages(finalMessages);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            <div className={cn(
                "hidden md:flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300",
                isCollapsed ? "w-[60px]" : "w-[260px]"
            )}>
                <AppSidebar
                    chats={chats}
                    currentChatId={chatId}
                    onSelectChat={handleSelectChat}
                    onDeleteChat={handleDeleteChat}
                    onRenameChat={handleRenameChat}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setIsSidebarOpen(false)} />
                    <div className="relative w-[280px] bg-card h-full shadow-xl animate-in slide-in-from-left duration-200">
                        <AppSidebar
                            chats={chats}
                            currentChatId={chatId}
                            onSelectChat={handleSelectChat}
                            onDeleteChat={handleDeleteChat}
                            onRenameChat={handleRenameChat}
                            isCollapsed={false}
                            onToggleCollapse={() => setIsSidebarOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative">
                {/* Header for Mobile */}
                <div className="md:hidden flex items-center p-4 border-b border-border bg-card/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10 h-16">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <span className="ml-2 font-semibold">
                        {chats.find(c => c.id === chatId)?.title || "ChatTube"}
                    </span>
                </div>

                <div className="flex-1 h-full pt-16 md:pt-0">
                    <ChatArea
                        messages={messages}
                        isLoading={isLoading}
                        onSendMessage={handleSendMessage}
                        videoUrl={chatId ? "https://youtube.com/watch?v=demo" : undefined}
                    />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
