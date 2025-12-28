import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { Video, Menu } from 'lucide-react';
import { Button } from '../components/ui/button-shadcn';
import { cn, extractYouTubeId } from '../lib/utils';
import { useChats, useCreateAndProcessChat, useDeleteChat, useUpdateChat, useDeleteChatQA } from '../hooks/api/useChat';
import { useChatSession } from '../hooks/useChatSession';
import { useBackgroundStreams } from '../hooks/useBackgroundStreams';
import { DEFAULT_LLM } from '../constants/llms';
import type { SupportedModel } from '../types/chats.api';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { toast } from 'sonner';

/**
 * Main Dashboard Component.
 * 
 * Uses the new useChatSession hook for a clean, robust query-response cycle:
 * 1. User sends query → Added to messages immediately
 * 2. Stream starts → streamingContent updates in real-time
 * 3. Stream completes → Assistant message added to messages
 * 4. Save to DB → Background operation
 * 
 * No more cache-to-UI synchronization issues!
 */
const Dashboard = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();

    // ========== CHAT LIST (Sidebar) ==========
    const { data: chatsData } = useChats();
    const chats = chatsData?.data || [];

    // ========== CHAT SESSION (Main Area) ==========
    // This hook is the SINGLE SOURCE OF TRUTH for chat messages and streaming
    const {
        messages,
        isStreaming,
        streamingContent,
        agentStatusMessage,
        isLoading,
        sendMessage,
    } = useChatSession({ chatId });

    // ========== BACKGROUND STREAMS ==========
    const { backgroundStreamCount } = useBackgroundStreams(chatId);

    // ========== MUTATIONS ==========
    const deleteChatMutation = useDeleteChat();
    const deleteChatQAMutation = useDeleteChatQA();
    const updateChatMutation = useUpdateChat();
    const createAndProcessChat = useCreateAndProcessChat();

    // ========== UI STATE ==========
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState("");
    const [selectedModel, setSelectedModel] = useState<SupportedModel>(DEFAULT_LLM as SupportedModel);

    // ========== HANDLERS ==========
    const handleCreateChat = async (url: string) => {
        try {
            const newChat = await createAndProcessChat.mutateAsync({
                url,
                onStatusChange: (status) => setLoadingLabel(status)
            });

            if (newChat && 'uuid' in newChat) {
                setIsSidebarOpen(false);
                navigate(`/chat/${newChat.uuid}`);
            }
        } catch (error) {
            console.error("Creation failed", error);
            toast.error("Failed to create chat");
        } finally {
            setLoadingLabel("");
        }
    };

    const handleDeleteChat = async (id: string) => {
        try {
            await deleteChatMutation.mutateAsync(id);
            if (chatId === id) {
                navigate('/');
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleDeleteChatQA = async (id: string) => {
        try {
            await deleteChatQAMutation.mutateAsync(id);
        } catch (error) {
            console.error("Delete QA failed", error);
        }
    };

    const handleRenameChat = async (id: string, title: string) => {
        await updateChatMutation.mutateAsync({ id, title });
    };

    const handleSelectChat = (id: string) => {
        navigate(`/chat/${id}`);
        setIsSidebarOpen(false);
    };

    const handleSendMessage = async (text: string) => {
        // If no chat selected, create a new chat first
        if (!chatId) {
            handleCreateChat(text);
            return;
        }

        // Get video ID for the current chat
        const videoUrl = chats.find(c => c.uuid === chatId)?.youtube_video_url;
        const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;

        if (!videoId) {
            toast.error("Unable to find video ID for this chat");
            return;
        }

        // Send message via the chat session hook
        // This handles: add user msg → stream → add assistant msg → save to DB
        await sendMessage(text, videoId, selectedModel);
    };

    // Listen for navigation events from notifications (for background streams)
    useEffect(() => {
        const handleNavigateToChat = (event: CustomEvent) => {
            const targetChatId = event.detail?.chatId;
            if (targetChatId) {
                navigate(`/chat/${targetChatId}`);
            }
        };

        window.addEventListener('navigate-to-chat' as any, handleNavigateToChat);
        return () => {
            window.removeEventListener('navigate-to-chat' as any, handleNavigateToChat);
        };
    }, [navigate]);

    // ========== RENDER ==========
    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Multi-step loader for Chat Creation process */}
            <FullScreenLoader isVisible={!!loadingLabel} label={loadingLabel} />

            {/* Desktop Sidebar */}
            <div className={cn(
                "hidden md:flex flex-col h-full shrink-0 overflow-hidden transition-all duration-300 border-r border-border",
                isCollapsed ? "w-[60px]" : "w-[260px]"
            )}>
                <AppSidebar
                    chats={chats}
                    currentChatId={chatId}
                    onSelectChat={(uuid) => navigate(`/chat/${uuid}`)}
                    onDeleteChat={handleDeleteChat}
                    onDeleteChatQA={handleDeleteChatQA}
                    onRenameChat={handleRenameChat}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {/* Mobile Sidebar (Overlay) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setIsSidebarOpen(false)} />
                    <div className="relative w-[280px] bg-card h-full shadow-xl animate-in slide-in-from-left duration-200">
                        <AppSidebar
                            chats={chats}
                            currentChatId={chatId}
                            onSelectChat={handleSelectChat}
                            onDeleteChat={handleDeleteChat}
                            onDeleteChatQA={handleDeleteChatQA}
                            onRenameChat={handleRenameChat}
                            isCollapsed={false}
                            onToggleCollapse={() => setIsSidebarOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative">
                {/* Mobile Header */}
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

                {/* Chat Area */}
                <div className="flex-1 h-full pt-16 md:pt-0">
                    <ChatArea
                        messages={messages}
                        isLoading={isLoading}
                        isStreaming={isStreaming}
                        agentStatus={agentStatusMessage}
                        streamMessage={streamingContent}
                        onSendMessage={handleSendMessage}
                        videoUrl={chats.find(c => c.uuid === chatId)?.youtube_video_url}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                    />

                    {/* Background Processing Indicator */}
                    {backgroundStreamCount > 0 && (
                        <div className="absolute top-20 right-4 z-20 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                                <div className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </div>
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    {backgroundStreamCount} {backgroundStreamCount === 1 ? 'Chat' : 'Chats'} Processing
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;