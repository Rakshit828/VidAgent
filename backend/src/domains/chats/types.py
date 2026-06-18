from pydantic import BaseModel

class CreateNewChatRecordModel(BaseModel):
    video_id: str 
    chat_title: str 