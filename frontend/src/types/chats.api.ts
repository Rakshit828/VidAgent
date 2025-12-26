export interface CreateChatSchema {
    title: string;
    youtubeVideoUrl: string; // Backend uses alias "youtubeVideoUrl" for youtube_video_url
}

export interface UpdateChatSchema {
    title?: string;
    youtubeVideoUrl?: string;
}

export interface SaveQASchema{
    query: string;
    answer: string;
}

export type SupportedModel = 
    | "openai/gpt-oss-120b"
    | "openai/gpt-oss-20b"
    | "meta-llama/llama-4-scout-17b-16e-instruct"
    | "qwen/qwen3-32b"
    | "llama-3.1-8b-instant"
    | "llama-3.3-70b-versatile"
    | "moonshotai/kimi-k2-instruct-0905";

export interface AgentQueryData {
    query: string;
    video_id: string;
    model: SupportedModel;
}
