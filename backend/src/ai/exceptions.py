from fastapi import HTTPException, status
from src.auth.exceptions import make_error_detail


class VectorDatabaseError(HTTPException):
    def __init__(
        self, 
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
        message = "An unexpected server error during video related task was occurred",
        headers = None
    ):
        self.detail = make_error_detail(error_name="vector_database_error", message=message)
        super().__init__(status_code, self.detail, headers)


class RetrieverError(HTTPException):
    def __init__(
        self, 
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, 
        detail = make_error_detail(error_name="retriever_error", message="An unexpected server error during video related task was occurred"),
        headers = None
    ):
        super().__init__(status_code, detail, headers)



class EnglishTranscripNotFoundError(HTTPException):
    def __init__(self, headers=None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=make_error_detail("english_transcript_not_found_error", "The given video does not support English."),
            headers=headers
        )

class TranscriptNotAllowedError(HTTPException):
    def __init__(self, headers=None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=make_error_detail("transcript_not_allowed_error", "Video is not supported for chatting."),
            headers=headers
        )


class VideoNotFoundError(HTTPException):
    def __init__(self, headers=None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=make_error_detail("video_not_found_error", "Provided youtube video doesn't exist"),
            headers=headers
        )


class UnexpectedErrorOccurredInTranscriptError(HTTPException):
    def __init__(self, headers=None):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=make_error_detail("unexpected_error_occurred_in_transcript_error", "An unexpected error occurred during video load."),
            headers=headers
        )



class TranscriptDoesNotExistError(HTTPException):
    def __init__(self, headers=None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=make_error_detail("transcript_does_not_exist_error", "Load the video first."),
            headers=headers
        )


class TranscriptAlreadyExistError(HTTPException):
    def __init__(self, headers=None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=make_error_detail("transcript_already_exists_error", "Video already loaded."),
            headers=headers
        )