from typing import TypedDict
from enum import Enum


class InngestEventsEnum(str, Enum):
    CHAT_CREATED = "chat:created"


class ChatCreatedEventInputData(TypedDict):
    video_id: str
    chat_id: str
    yt_video_id: str
