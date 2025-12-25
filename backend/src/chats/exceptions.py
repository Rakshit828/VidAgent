from src.app_responses import ErrorResponse, T


class InvalidYoutubeURLError(ErrorResponse[T]):
    error: str = "invalid_youtube_url_error"
    message: str = "Invalid YouTube URL or video ID."
    data: T | None = None
