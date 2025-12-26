import React, { useRef, useEffect } from 'react';
import { Button } from '../ui/button-shadcn';
import { Input } from '../ui/input-shadcn';
import { ScrollArea } from '../ui/scroll-area';
import { Send, Bot, User, Youtube, Copy, Check, Video } from 'lucide-react';
import type { MockMessage } from '../../mock/data';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn, extractYouTubeId } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ChatAreaProps {
    messages: MockMessage[];
    isLoading?: boolean;
    onSendMessage: (message: string) => void;
    videoUrl?: string; // For embedding
}

export function ChatArea({
    messages,
    isLoading,
    onSendMessage,
    videoUrl
}: ChatAreaProps) {
    const [input, setInput] = React.useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleCopy = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl mx-auto space-y-6 pb-4 h-full flex flex-col">
                    {/* YouTube Video Player */}
                    {videoUrl && (
                        <div className="rounded-xl overflow-hidden border border-border shadow-xl mb-6 bg-black/5 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="aspect-video w-full bg-muted relative">
                                {(() => {
                                    const videoId = extractYouTubeId(videoUrl);
                                    if (videoId) {
                                        return (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowFullScreen
                                                className="absolute inset-0 w-full h-full"
                                            ></iframe>
                                        );
                                    }
                                    return (
                                        <div className="flex flex-col items-center justify-center h-full gap-2">
                                            <Youtube className="w-12 h-12 text-muted-foreground/50" />
                                            <span className="text-sm text-muted-foreground font-medium">Invalid Video URL</span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="p-3 bg-card border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2 truncate">
                                    <Video className="w-3 h-3 text-primary" />
                                    <span className="truncate max-w-[200px] md:max-w-md">{videoUrl}</span>
                                </div>
                                <span className="text-green-500 flex items-center gap-1 font-semibold whitespace-nowrap">
                                    Processed <Check className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    )}

                    {!videoUrl && messages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-700">
                            {/* Hero Section */}
                            <div className="relative mb-8 group">
                                <div className="absolute -inset-8 bg-linear-to-r from-primary/30 to-purple-600/30 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000 animate-pulse"></div>
                                <div className="relative bg-linear-to-b from-card to-muted p-6 rounded-[2.5rem] border border-border/50 shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
                                    <div className="bg-primary/20 p-4 rounded-4xl">
                                        <Video className="w-16 h-16 text-primary" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-red-600 text-[10px] font-bold text-white px-2 py-1 rounded-md shadow-lg transform rotate-12">
                                        AI POWERED
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Analyze <span className="text-primary">Any</span> Video
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-lg mb-10 leading-relaxed font-medium">
                                Paste a YouTube link and dive deep into the content with our advanced AI analyzer. Summaries, key moments, and instant Q&A.
                            </p>

                            {/* Premium Input Field */}
                            <div className="w-full max-w-xl relative group px-2">
                                <div className="absolute -inset-1 bg-linear-to-r from-primary via-purple-600 to-primary rounded-4xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-focus-within:opacity-100"></div>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (input.includes('youtube.com') || input.includes('youtu.be')) {
                                            onSendMessage(input);
                                            setInput('');
                                        }
                                    }}
                                    className="relative flex items-center bg-card/80 backdrop-blur-xl rounded-[1.8rem] border border-white/10 shadow-2xl p-1.5 transition-all duration-300 group-focus-within:ring-2 ring-primary/20"
                                >
                                    <div className="pl-4 pr-2 text-muted-foreground transition-colors group-focus-within:text-primary">
                                        <Youtube className="w-6 h-6 shrink-0" />
                                    </div>
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Paste YouTube Video URL here..."
                                        className="h-8 md:h-12 border-0 shadow-none outline-0 focus:outline-0 focus-visible:outline-0 focus-visible:ring-0 bg-transparent text-lg placeholder:text-muted-foreground/50 transition-all pl-1 pr-24 md:pr-32"
                                    />
                                    <div className="absolute right-1.5 top-1.5 bottom-1.5">
                                        <Button
                                            type="submit"
                                            className="h-full px-6 md:px-8 rounded-[1.4rem] bg-linear-to-r from-primary to-purple-600 hover:opacity-90 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95"
                                        >
                                            Analyze
                                        </Button>
                                    </div>
                                </form>
                            </div>

                            <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm font-semibold">
                                <span className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border/50 text-secondary-foreground shadow-sm hover:bg-secondary transition-colors cursor-default">
                                    <Bot className="w-4 h-4 text-primary" /> Multi-lingual
                                </span>
                                <span className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border/50 text-secondary-foreground shadow-sm hover:bg-secondary transition-colors cursor-default">
                                    <Check className="w-4 h-4 text-green-500" /> Precise Moments
                                </span>
                                <span className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border/50 text-secondary-foreground shadow-sm hover:bg-secondary transition-colors cursor-default">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live Analysis
                                </span>
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-4 w-full",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <Avatar className={cn(
                                "w-8 h-8",
                                msg.role === 'assistant' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                <AvatarFallback>
                                    {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </AvatarFallback>
                            </Avatar>

                            <div className={cn(
                                "group relative flex flex-col gap-1 max-w-[80%]",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "rounded-2xl px-4 py-3 text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-muted/50 border border-border rounded-tl-sm text-foreground"
                                )}>
                                    {msg.content}
                                </div>

                                {msg.role === 'assistant' && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-8 top-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(msg.content, msg.id)}>
                                                        {copiedId === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Copy</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 w-full">
                            <Avatar className="w-8 h-8 bg-primary/10 text-primary">
                                <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-1 bg-muted/30 px-4 py-3 rounded-2xl rounded-tl-sm">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Footer - Only show if we have an active session (videoUrl or messages) */}
            {(videoUrl || messages.length > 0) && (
                <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
                    <div className="max-w-3xl mx-auto relative">
                        <form onSubmit={handleSubmit} className="relative">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask something about the video..."
                                className="pr-12 py-6 rounded-full shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20 bg-muted/50"
                                disabled={isLoading}
                            />
                            <Button
                                size="icon"
                                type="submit"
                                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full"
                                disabled={!input.trim() || isLoading}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                            ChatTube can make mistakes. Consider checking important information.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
