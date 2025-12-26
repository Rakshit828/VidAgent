import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { Video, Menu } from 'lucide-react';
import { Button } from '../components/ui/button-shadcn';
import { cn, extractYouTubeId } from '../lib/utils';
import { useChats, useCreateAndProcessChat, useDeleteChat, useUpdateChat, useChatData } from '../hooks/api/useChat';
import { useAgentStream } from '../hooks/useAgentStream';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { toast } from 'sonner';
import type { MockMessage } from '../mock/data';
import type { QA } from '../types';

/**
 * Main Dashboard Component.
 * Orchestrates Chats, Sidebar and ChatArea.
 * Now integrated with real API hooks and Agent streaming.
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
    const [streamingMessageId, setStreamingMessageId] = useState("");

    // Agent Streaming Hook - Only instantiate if we have a chatId
    const {
        isStreaming,
        statusMessage,
        startStream,
        cancelStream
    } = useAgentStream({
        chatId: chatId || '',
        onStreamComplete: (finalMessage) => {
            // Update the message with final content
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== streamingMessageId);
                return [
                    ...filtered,
                    {
                        id: streamingMessageId,
                        role: 'assistant',
                        content: finalMessage,
                        timestamp: new Date().toLocaleTimeString()
                    }
                ];
            });
        },
        onError: (error) => {
            toast.error(`Agent Error: ${error.message}`);
        }
    });

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

    // Cleanup stream on unmount
    useEffect(() => {
        return () => {
            cancelStream();
        };
    }, [cancelStream]);

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
        if (window.confirm("Are you sure you want to delete this analysis?")) {
            await deleteChatMutation.mutateAsync(id);
            if (chatId === id) {
                navigate('/');
            }
        }
    };

    const handleRenameChat = async (id: string, newTitle: string) => {
        await updateChatMutation.mutateAsync({ id, title: newTitle });
    };

    const handleSelectChat = (id: string) => {
        navigate(`/chat/${id}`);
        setIsSidebarOpen(false);
    };

    const handleSendMessage = async (text: string) => {
        if (!chatId) {
            handleCreateChat(text);
            return;
        }

        const videoUrl = chats.find(c => c.uuid === chatId)?.youtube_video_url;
        const videoId = videoUrl ? extractYouTubeId(videoUrl) : null;

        if (!videoId) {
            toast.error("Unable to find video ID for this chat");
            return;
        }

        // 1. Add User Message Locally
        const userMsg: MockMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, userMsg]);

        // 2. Start Agent Streaming
        const assistantId = (Date.now() + 1).toString();
        setStreamingMessageId(assistantId);

        const finalResponse = await startStream(text, videoId);

        if (!finalResponse) {
            // Stream was cancelled or errored - remove placeholder if needed
            toast.warning("Response generation was interrupted");
        }
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
                        isStreaming={isStreaming}
                        agentStatus={statusMessage}
                        onSendMessage={handleSendMessage}
                        videoUrl={chats.find(c => c.uuid === chatId)?.youtube_video_url}
                    />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
