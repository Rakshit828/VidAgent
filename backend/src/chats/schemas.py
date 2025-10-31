from pydantic import BaseModel, Field, field_validator
from src.utils.utils import get_video_id
from uuid import UUID
from typing import Optional, Any, List
from datetime import datetime
from .exceptions import InvalidYoutubeURLError

class CreateChatSchema(BaseModel):
    title: str
    youtube_video_url: str = Field(alias="youtubeVideoUrl")

    @field_validator("youtube_video_url")
    @classmethod
    def validate_url(cls, value: Any):
        """
        Accepts all valid YouTube URL formats or plain 11-char video IDs.
        """
        if get_video_id(value):
            return value
        raise InvalidYoutubeURLError("Invalid YouTube URL or video ID.")


class UpdateChatSchema(BaseModel):
    title: Optional[str] = None
    youtube_video_url: Optional[str] = Field(default=None, alias="youtubeVideoUrl")

    @field_validator("youtube_video_url")
    @classmethod
    def validate_url(cls, value: Any):
        """
        Accepts all valid YouTube URL formats or plain 11-char video IDs.
        """
        if value is None:
            return value
        if get_video_id(value):
            return value
        raise InvalidYoutubeURLError("Invalid YouTube URL or video ID.")

class CreateQASchema(BaseModel):
    query: str
    answer: str
    chat_uid: UUID 

class ResponseChatSchema(BaseModel):
    uuid: UUID
    title: str
    youtube_video_url: str
    created_at: datetime

    class Config:
        orm_mode = True


class ResponseQASchema(BaseModel):
    query: str
    answer: str
    chat_uid: UUID


class ResponseCurrentChatSchema(BaseModel):
    selected_chat_id: str
    youtube_video_url: str
    is_transcript_generated: bool = False
    questions_answers: List[ResponseQASchema]