from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio.session import AsyncSession
from loguru import logger
from src.domains.auth.dependencies import AccessTokenBearer
from typing import Dict, Any
from .types import CreateNewChatRecordModel
from .service import ChatsService
from src.db.postgres.setup import get_session

chats_router = APIRouter()


@chats_router.post("/")
async def create_new_chat_record(
    payload: CreateNewChatRecordModel,
    decoded_token: Dict[str, Any] = Depends(AccessTokenBearer().check),
    chats_service: ChatsService = Depends(ChatsService),
    session: AsyncSession = Depends(get_session),
) -> None:
    user_id = decoded_token["sub"]
    await chats_service.create_new_video_and_chat(
        session=session, video_id=payload.video_id, user_id=user_id, chat_title=payload.chat_title
    )
    return
