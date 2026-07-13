from typing import TypedDict
from src.lib.weviate_db.types import SearchTypeEnum, YoutubeInfoCollectionObject
from src.db.postgres.schemas import MessageRoleEnum
from datetime import datetime


class GetVideoContextFromVdbInput(TypedDict):
    video_id: str
    field: str
    search_type: SearchTypeEnum
    query: str
    limit: int


class GetVideoContextFromVdbOutput(TypedDict):
    data: list[YoutubeInfoCollectionObject]


class CreateNewMessageRecordInput(TypedDict):
    chat_id: str
    role: MessageRoleEnum
    content: str
    tokens: int
    should_commit: bool


class CreateNewMessageRecordOutput(TypedDict):
    message_id: str
    chat_id: str
    content: str
    tokens: int
    role: MessageRoleEnum
    created_at: datetime
