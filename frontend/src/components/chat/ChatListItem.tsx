import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2, MessageSquare, Eraser } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button-shadcn';
import { Input } from '../ui/input-shadcn';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { StreamingBadge } from './StreamingBadge';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Chat } from '../../types';

interface ChatListItemProps {
    chat: Chat;
    isActive: boolean;
    isCollapsed: boolean;
    isStreaming?: boolean;
    onSelect: (uuid: string) => void;
    onRename: (uuid: string, newTitle: string) => void;
    onDelete: (uuid: string) => void;
    onDeleteQA: (uuid: string) => void;
}

export function ChatListItem({
    chat,
    isActive,
    isCollapsed,
    isStreaming,
    onSelect,
    onRename,
    onDelete,
    onDeleteQA,
}: ChatListItemProps) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(chat.title);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            setEditValue(chat.title);
        }
    }, [isEditing, chat.title]);

    const handleSave = () => {
        if (editValue.trim() && editValue.trim() !== chat.title) {
            onRename(chat.uuid, editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            handleSave();
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setIsEditing(false);
            setEditValue(chat.title);
        }
    };

    const handleDelete = () => {
        onDelete(chat.uuid);
        setShowDeleteConfirm(false);
    };

    const handleClear = () => {
        onDeleteQA(chat.uuid);
        setShowClearConfirm(false);
    };

    const handleClearClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // Attempt to check cache for message count
        const cachedData: any = queryClient.getQueryData(['chat-data', chat.uuid]);
        const qaList = cachedData?.data?.questions_answers;

        // If we have cached data and it's empty, show toast
        if (qaList && qaList.length === 0) {
            toast.info("No conversation");
            return;
        }

        // If no cached data, we can't be sure, so we show the confirm dialog anyway
        // or we could assume it's empty if not found, but it's safer to proceed to confirm.
        setShowClearConfirm(true);
    };

    // If collapsed, strictly show an icon w/ helper title
    if (isCollapsed) {
        return (
            <div
                onClick={() => onSelect(chat.uuid)}
                className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-muted cursor-pointer mx-auto",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
                title={chat.title}
            >
                <MessageSquare className="h-4 w-4" />
                {isStreaming && (
                    <div className="absolute -top-0.5 -right-0.5">
                        <StreamingBadge variant="minimal" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div
                onClick={() => !isEditing && onSelect(chat.uuid)}
                className={cn(
                    "group relative flex w-full max-w-full overflow-hidden items-center rounded-md px-2 py-2 text-sm cursor-pointer transition-colors hover:bg-accent/50",
                    isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
                )}
            >
                {/* Title Container - flex-1 and w-0 are critical for truncation inside flex */}
                <div className="flex-1 w-0 pr-8 flex items-center gap-2">
                    {isEditing ? (
                        <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSave}
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 py-0 px-1 text-sm bg-background/80 w-full"
                        />
                    ) : (
                        <>
                            <span className="block truncate">
                                {chat.title}
                            </span>
                            {isStreaming && (
                                <StreamingBadge variant="minimal" className="shrink-0" />
                            )}
                        </>
                    )}
                </div>

                {/* Actions - Absolute positioned to stay fixed on the right */}
                {!isEditing && (
                    <div className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 flex items-center",
                        "opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100"
                    )}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/80"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleClearClick}
                                >
                                    <Eraser className="mr-2 h-4 w-4" />
                                    Clear Conversation
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Chat"
                description={`Are you sure you want to delete "${chat.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />

            <ConfirmationDialog
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClear}
                title="Clear Conversation"
                description="Are you sure you want to clear all questions and answers in this chat? The chat session will be preserved."
                confirmText="Clear"
                variant="destructive"
            />
        </>
    );
}
