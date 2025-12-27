import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2, MessageSquare } from 'lucide-react';
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
import type { Chat } from '../../types';

interface ChatListItemProps {
    chat: Chat;
    isActive: boolean;
    isCollapsed: boolean;
    isStreaming?: boolean;
    onSelect: (uuid: string) => void;
    onRename: (uuid: string, newTitle: string) => void;
    onDelete: (uuid: string) => void;
}

export function ChatListItem({
    chat,
    isActive,
    isCollapsed,
    isStreaming,
    onSelect,
    onRename,
    onDelete,
}: ChatListItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(chat.title);
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
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(chat.uuid);
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
    );
}