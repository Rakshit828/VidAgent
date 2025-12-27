import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Cpu, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button-shadcn';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { SUPPORTED_LLMS } from '../../constants/llms';
import type { SupportedModel } from '../../types/chats.api';
import { cn } from '../../lib/utils';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
    isStreaming?: boolean;
    selectedModel: SupportedModel;
    onModelChange: (model: SupportedModel) => void;
}

export function ChatInput({
    onSendMessage,
    isLoading,
    isStreaming,
    selectedModel,
    onModelChange,
}: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [input]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim() && !isLoading && !isStreaming) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 z-30 pt-20 pb-8 px-4 md:px-8 pointer-events-none bg-linear-to-t from-background via-background/90 to-transparent">
            <div className="max-w-3xl mx-auto relative group pointer-events-auto">
                {/* Visual Glow Effect */}
                <div className="absolute -inset-1 bg-linear-to-r from-primary/20 via-purple-600/20 to-primary/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition duration-700" />

                <div className="relative flex flex-col bg-background/60 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 group-focus-within:ring-1 ring-primary/20 group-focus-within:border-primary/30 overflow-hidden">

                    {/* Top Bar with Model Selection */}
                    <div className="flex items-center justify-between px-4 pt-2.5 pb-0.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5"
                                    disabled={isLoading || isStreaming}
                                >
                                    <Cpu className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {SUPPORTED_LLMS[selectedModel]?.split(' ')[0]}
                                    </span>
                                    <ChevronDown className="w-2 h-2 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 mb-2">
                                {Object.entries(SUPPORTED_LLMS).map(([id, name]) => (
                                    <DropdownMenuItem
                                        key={id}
                                        onClick={() => onModelChange(id as SupportedModel)}
                                        className={cn(
                                            "text-xs font-medium cursor-pointer",
                                            selectedModel === id && "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Textarea Area */}
                    <div className="flex items-end gap-2 px-4 pb-3.5">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isStreaming ? "Wait for AI response..." : "Ask something about the video..."}
                            className={cn(
                                "flex-1 bg-transparent border-0 ring-0 focus:ring-0 outline-none resize-none py-1.5 min-h-[32px] max-h-[120px] text-[15px] leading-relaxed placeholder:text-muted-foreground/40 custom-scrollbar",
                                input.split('\n').length > 4 || (textareaRef.current?.scrollHeight || 0) > 110 ? "overflow-y-auto" : "overflow-hidden"
                            )}
                            disabled={isLoading || isStreaming}
                            rows={1}
                        />

                        <Button
                            size="icon"
                            onClick={() => handleSubmit()}
                            className={cn(
                                "h-8 w-8 shrink-0 rounded-full transition-all duration-500",
                                isStreaming ? "bg-muted cursor-not-allowed" : "bg-primary shadow-lg shadow-primary/20 active:scale-90"
                            )}
                            disabled={!input.trim() || isLoading || isStreaming}
                        >
                            {isStreaming ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                        </Button>
                    </div>
                </div>

                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <p className="text-[9px] text-muted-foreground/40 uppercase tracking-[0.2em] font-black pointer-events-none">
                        ChatTube AI Analyzer
                    </p>
                </div>
            </div>
        </div>
    );
}
