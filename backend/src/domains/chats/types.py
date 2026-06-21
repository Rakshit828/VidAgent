from pydantic import BaseModel
from src.db.postgres.schemas import VideoProcessingStatusEnum


class CreateNewChatRecordModel(BaseModel):
    video_id: str
    chat_title: str


class CreateNewChatResponseModel(BaseModel):
    video_id: str 
    chat_id: str 
    video_processing_status: VideoProcessingStatusEnum
    chat_title: str 