import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Video,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { Button } from '../ui/button-shadcn';
import { ScrollArea } from '../ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ModeToggle } from '../mode-toggle';
import { ChatListItem } from '../chat/ChatListItem';
import { cn } from '../../lib/utils';
import type { MockChat } from '../../mock/data';

interface AppSidebarProps {
    chats: MockChat[];
    currentChatId?: string;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onRenameChat: (id: string, newTitle: string) => void;
    className?: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export function AppSidebar({
    chats,
    currentChatId,
    onSelectChat,
    onDeleteChat,
    onRenameChat,
    className,
    isCollapsed,
    onToggleCollapse
}: AppSidebarProps) {
    const navigate = useNavigate();

    return (
        <div
            className={cn(
                "flex flex-col h-full w-full bg-card border-r border-border overflow-hidden",
                className
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex items-center h-14 px-3 border-b border-border/40",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && (
                    <div className="flex items-center gap-2 overflow-hidden cursor-pointer" onClick={() => navigate('/')}>
                        <div className="flex items-center justify-center p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                            <Video className="w-4 h-4" />
                        </div>
                        <span className="font-semibold tracking-tight truncate">ChatTube</span>
                    </div>
                )}

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                onClick={onToggleCollapse}
                            >
                                {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
                {isCollapsed ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-full h-9"
                                    onClick={() => navigate('/')}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">New Chat</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Button
                        variant="default"
                        className="w-full justify-start h-9 px-3 font-normal shadow-none"
                        onClick={() => navigate('/')}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>
                )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-1 px-2 pb-4 w-full max-w-full overflow-hidden">
                        {chats.map((chat) => (
                            <ChatListItem
                                key={chat.id}
                                chat={chat}
                                isActive={currentChatId === chat.id}
                                isCollapsed={isCollapsed}
                                onSelect={onSelectChat}
                                onRename={onRenameChat}
                                onDelete={onDeleteChat}
                            />
                        ))}
                        {chats.length === 0 && !isCollapsed && (
                            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                                No chats yet.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Footer */}
            <div className="border-t border-border/40 p-3 mt-auto">
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-3">
                        <ModeToggle />
                        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden rounded-md p-1 hover:bg-accent/50 cursor-pointer flex-1 min-w-0">
                            <Avatar className="h-7 w-7 border shrink-0">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate leading-none">Demo User</span>
                                <span className="text-[10px] text-muted-foreground truncate leading-none mt-1">user@example.com</span>
                            </div>
                        </div>
                        <ModeToggle />
                    </div>
                )}
            </div>
        </div>
    );
}

