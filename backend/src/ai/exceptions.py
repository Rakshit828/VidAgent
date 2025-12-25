from src.app_responses import ErrorResponse, T
from fastapi import status

class VectorDatabaseError(ErrorResponse[T]):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    message: str = "Vector Database Error"
    error: str = "vector_database_error"
    data: T | None = None

class RetrieverError(ErrorResponse[T]):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    message: str = "An unexpected server error during video related task occurred"
    error: str = "retriever_error"
    data: T | None = None

class EnglishTranscriptNotFoundError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    message: str = "The given video does not support English."
    error: str = "english_transcript_not_found_error"
    data: T | None = None

class TranscriptNotAllowedError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    message: str = "Video is not supported for chatting."
    error: str = "transcript_not_allowed_error"
    data: T | None = None

class VideoNotFoundError(ErrorResponse[T]):
    status_code: int = status.HTTP_404_NOT_FOUND
    message: str = "Provided youtube video doesn't exist"
    error: str = "video_not_found_error"
    data: T | None = None

class UnexpectedErrorOccurredInTranscriptError(ErrorResponse[T]):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    message: str = "An unexpected error occurred during video load."
    error: str = "unexpected_error_occurred_in_transcript_error"
    data: T | None = None

class TranscriptDoesNotExistError(ErrorResponse[T]):
    status_code: int = status.HTTP_404_NOT_FOUND
    message: str = "Load the video first."
    error: str = "transcript_does_not_exist_error"
    data: T | None = None

class TranscriptAlreadyExistError(ErrorResponse[T]):
    status_code: int = status.HTTP_409_CONFLICT
    message: str = "Video already loaded."
    error: str = "transcript_already_exists_error"
    data: T | None = None