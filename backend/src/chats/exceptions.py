from src.app_responses import ErrorResponse, T
from fastapi import status

class InvalidYoutubeURLError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    error: str = "invalid_youtube_url_error"
    message: str = "Invalid YouTube URL or video ID."
    data: T | None = None


class ChatNotFoundError(ErrorResponse[T]):
    status_code: int = status.HTTP_404_NOT_FOUND
    error: str = "chat_not_found"
    message: str = "Chat with provided id not found."
    data: T | None = None
