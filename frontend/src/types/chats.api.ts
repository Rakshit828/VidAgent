export interface CreateChatSchema{
    title: string;
    youtubeVideoUrl: string;
}

export interface UpdateChatSchema{
    title: string;
    youtubeVideoUrl: string;
}

export interface SaveQASchema{
    query: string;
    answer: string;
}
