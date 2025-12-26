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
