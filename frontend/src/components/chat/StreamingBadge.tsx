import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StreamingBadgeProps {
    statusMessage?: string;
    variant?: 'default' | 'compact' | 'minimal';
    className?: string;
}

/**
 * StreamingBadge - Visual indicator for active streaming
 * Can be used in sidebar, chat area, or anywhere streaming status needs to be shown
 */
export function StreamingBadge({
    statusMessage,
    variant = 'default',
    className
}: StreamingBadgeProps) {
    if (variant === 'minimal') {
        return (
            <div className={cn("relative flex items-center", className)}>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={cn(
                "flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full border border-primary/10",
                className
            )}>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Streaming...</span>
            </div>
        );
    }

    return (
        <div className={cn(
            "flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 w-fit",
            className
        )}>
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>{statusMessage || 'Processing...'}</span>
            <Loader2 className="w-3 h-3 animate-spin ml-1" />
        </div>
    );
}
