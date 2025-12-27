import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/layout/AppSidebar';
import { ChatArea } from '../components/chat/ChatArea';
import { Video, Menu } from 'lucide-react';
import { Button } from '../components/ui/button-shadcn';
import { cn, extractYouTubeId } from '../lib/utils';
import { useChats, useCreateAndProcessChat, useDeleteChat, useUpdateChat, useChatData, useDeleteChatQA } from '../hooks/api/useChat';
import { useAgentStream } from '../hooks/useAgentStream';
import { useBackgroundStreams } from '../hooks/useBackgroundStreams';
import { streamManager } from '../services/streamManager';
import { DEFAULT_LLM } from '../constants/llms';
import type { SupportedModel } from '../types/chats.api';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { toast } from 'sonner';
import type { ChatMessage, QA } from '../types';

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
    const deleteChatQAMutation = useDeleteChatQA();
    const updateChatMutation = useUpdateChat();
    const createAndProcessChat = useCreateAndProcessChat();

    // UI States
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [loadingLabel, setLoadingLabel] = useState("");
    const [selectedModel, setSelectedModel] = useState<SupportedModel>(DEFAULT_LLM as SupportedModel);

    // Background streams management
    const { backgroundStreamCount } = useBackgroundStreams(chatId);

    // Track the current chat ID for background stream callbacks
    const currentChatIdRef = useRef(chatId);
    useEffect(() => {
        currentChatIdRef.current = chatId;
    }, [chatId]);

    // Agent Streaming Hook for current chat
    const {
        isStreaming,
        statusMessage,
        startStream,
    } = useAgentStream({
        chatId: chatId || '',
        onStreamComplete: async (completedChatId, query, answer) => {
            // Handle stream completion via StreamManager (always, for DB save/cache)
            // We don't need to manually update messages here anymore because
            // StreamManager will update the cache, which triggers the sync useEffect.
            await streamManager.handleStreamComplete(
                completedChatId,
                query,
                answer,
                completedChatId === currentChatIdRef.current // isCurrentChat
            );
        },
        onError: (failedChatId, error) => {
            streamManager.handleStreamError(failedChatId, error);
            if (failedChatId === currentChatIdRef.current) {
                toast.error(`Agent Error: ${error.message}`);
            }
        }
    });

    // Register global stream completion handler for background streams
    useEffect(() => {
        const unsubscribe = streamManager.onStreamComplete((completedChatId) => {
            // If the completed stream is not for the current chat, it was a background stream
            if (completedChatId !== chatId) {
                console.log(`Background stream completed for chat: ${completedChatId}`);
                // The StreamManager already handled DB save and cache update
                // Just log it here, notification is shown by StreamManager
            }
        });

        return unsubscribe;
    }, [chatId]);

    // Listen for navigation events from notifications
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

    // Use current API loading state
    const isLoading = isChatDataLoading;

    // Sync messages from the API when chat data is loaded
    useEffect(() => {
        if (currentChatData?.data?.questions_answers) {
            const apiMessages: ChatMessage[] = [];
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
        } catch (error) { }
    };

    const handleDeleteChatQA = async (id: string) => {
        try {
            await deleteChatQAMutation.mutateAsync(id);
            // If the chat whose QAs were deleted is the current chat, clear messages locally
            if (chatId === id) {
                setMessages([]);
            }
        } catch (error) { }
    };

    const handleRenameChat = async (id: string, title: string) => {
        await updateChatMutation.mutateAsync({ id, title });
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
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, userMsg]);

        // 2. Start Agent Streaming
        const finalResponse = await startStream(text, videoId, selectedModel);

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
                    onSelectChat={(uuid) => navigate(`/chat/${uuid}`)}
                    onDeleteChat={handleDeleteChat}
                    onDeleteChatQA={handleDeleteChatQA}
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
                            onDeleteChatQA={handleDeleteChatQA}
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
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                    />
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
