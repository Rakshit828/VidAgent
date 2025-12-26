import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { Video, Menu } from 'lucide-react';
import { Button } from '../components/ui/button-shadcn';
import { cn } from '../lib/utils';
import { useChats, useCreateAndProcessChat, useDeleteChat, useUpdateChat, useChatData } from '../hooks/api/useChat';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import type { MockMessage } from '../mock/data';
import type { QA } from '../types';

/**
 * Main Dashboard Component.
 * Orchestrates Chats, Sidebar and ChatArea.
 * Now integrated with real API hooks for CRUD operations.
 */
const Dashboard = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();

    // API Hooks for data fetching and mutations
    const { data: chatsData } = useChats();
    const chats = chatsData?.data || [];

    // Fetch data for the selected chat
    const { data: currentChatData, isLoading: isChatDataLoading } = useChatData(chatId);

    const deleteChatMutation = useDeleteChat();
    const updateChatMutation = useUpdateChat();
    const createAndProcessChat = useCreateAndProcessChat();

    // UI States
    const [messages, setMessages] = useState<MockMessage[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState("");

    // Use current API loading state
    const isLoading = isChatDataLoading;

    // Sync messages from the API when chat data is loaded
    useEffect(() => {
        if (currentChatData?.data?.questions_answers) {
            const apiMessages: MockMessage[] = [];
            currentChatData.data.questions_answers.forEach((qa: QA, index: number) => {
                apiMessages.push({
                    id: `q-${index}`,
                    role: 'user',
                    content: qa.query,
                    timestamp: 'Past'
                });
                apiMessages.push({
                    id: `a-${index}`,
                    role: 'assistant',
                    content: qa.answer,
                    timestamp: 'Past'
                });
            });
            setMessages(apiMessages);
        } else if (!chatId) {
            setMessages([]);
        }
    }, [currentChatData, chatId]);

    /**
     * Handles the sequential process of creating a chat and processing the video.
     */
    const handleCreateChat = async (url: string) => {
        try {
            // The hook handles statuses internally via callbacks
            const newChat = await createAndProcessChat.mutateAsync({
                url,
                onStatusChange: (status) => setLoadingLabel(status)
            });

            if (newChat && 'uuid' in newChat) {
                setIsSidebarOpen(false);
                // Navigate to the newly created chat
                navigate(`/chat/${newChat.uuid}`);
            }
        } catch (error) {
            console.error("Creation failed", error);
        } finally {
            setLoadingLabel("");
        }
    };

    /**
     * Deletes a chat and redirects if it's the currently active one.
     */
    const handleDeleteChat = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this analysis?")) {
            await deleteChatMutation.mutateAsync(id);
            if (chatId === id) {
                navigate('/');
            }
        }
    };

    /**
     * Updates the chat title.
     */
    const handleRenameChat = async (id: string, newTitle: string) => {
        await updateChatMutation.mutateAsync({ id, title: newTitle });
    };

    const handleSelectChat = (id: string) => {
        navigate(`/chat/${id}`);
        setIsSidebarOpen(false);
    };

    const handleSendMessage = (text: string) => {
        if (!chatId) {
            // Home screen case: input is likely a YouTube URL
            handleCreateChat(text);
            return;
        }

        // Mock chat addition logic - locally adding the user message
        const newMsg: MockMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: 'Now'
        };

        setMessages(prev => [...prev, newMsg]);

        // TODO: Integrate with real LLM response API
    };

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Multi-step loader for Chat Creation process */}
            <FullScreenLoader isVisible={!!loadingLabel} label={loadingLabel} />

            {/* Desktop Sidebar (Sidebar is always visible on desktop) */}
            <div className={cn(
                "hidden md:flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300 border-r border-border",
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

            {/* Mobile Sidebar (Animated overlay for mobile screens) */}
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

            {/* Main Application Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative">
                {/* Mobile-only Header */}
                <div className="md:hidden flex items-center p-4 border-b border-border bg-card/50 backdrop-blur-sm absolute top-0 left-0 right-0 z-10 h-16">
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2 ml-2">
                        <Video className="w-4 h-4 text-primary" />
                        <span className="font-semibold truncate">
                            {chats.find(c => c.uuid === chatId)?.title || "ChatTube"}
                        </span>
                    </div>
                </div>

                {/* Chat and Analysis Area */}
                <div className="flex-1 h-full pt-16 md:pt-0">
                    <ChatArea
                        messages={messages}
                        isLoading={isLoading}
                        onSendMessage={handleSendMessage}
                        videoUrl={chats.find(c => c.uuid === chatId)?.youtube_video_url}
                    />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
