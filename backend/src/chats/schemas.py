from pydantic import BaseModel, Field, field_validator, ConfigDict
from src.utils import get_video_id
from uuid import UUID
from typing import Optional, Any, List, Literal
from datetime import datetime
from .exceptions import InvalidYoutubeURLError


class AgentQueryData(BaseModel):
    query: str
    video_id: str
    model: Literal[
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "qwen/qwen3-32b",
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "moonshotai/kimi-k2-instruct-0905"
    ] = "openai/gpt-oss-120b"


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

class ResponseChatSchema(BaseModel):
    uuid: UUID
    title: str
    youtube_video_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResponseQASchema(BaseModel):
    query: str
    answer: str
    chat_uid: str

    model_config = ConfigDict(from_attributes=True, extra="ignore") 


class ResponseChatDataSchema(BaseModel):
    selected_chat_id: str
    youtube_video_url: str
    is_transcript_generated: bool = False
    questions_answers: List[ResponseQASchema]