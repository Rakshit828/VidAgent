from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from .schemas import CreateQASchema, ResponseQASchema, CreateChatSchema, UpdateChatSchema, ResponseChatSchema, ResponseCurrentChatSchema
from .services import chat_service
from src.db.main import get_session
from src.auth.dependencies import AccessTokenBearer
from typing import Dict, List
from src.ai.exceptions import (
    TranscriptDoesNotExistError,
    TranscriptAlreadyExistError
)

chats_router = APIRouter()


@chats_router.post(
    "/newchat", 
    response_model=ResponseChatSchema
)
async def create_new_chat(
    chat_data: CreateChatSchema,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    user_uid = decoded_token_data['sub']
    chat_data_dict = chat_data.model_dump()
    new_chat = await chat_service.create_chat(user_uid=user_uid, chat_data=chat_data_dict, session=session)
    return new_chat



@chats_router.get(
    "/allchats", 
    response_model=List[ResponseChatSchema]
)
async def get_all_chats(
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    user_uid = decoded_token_data['sub']
    all_chats = await chat_service.get_all_chats_by_uuid(user_uid=user_uid, session=session)
    print(all_chats)
    return all_chats



@chats_router.put(
    "/updatechat/{chat_uid}", 
    response_model=ResponseChatSchema
)
async def update_chat(
    chat_uid: str,
    chat_data: UpdateChatSchema,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    chat_data_dict = chat_data.model_dump(exclude_defaults=True)
    updated_chat = await chat_service.update_chat(chat_uid=chat_uid, chat_data=chat_data_dict, session=session)
    return updated_chat


@chats_router.delete(
    "/delete/{chat_uid}",
)
async def delete_chat(
    request: Request,
    chat_uid, 
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    user_id = decoded_token_data['sub']
    youtube_video_url = await chat_service.get_video_url_by_chatid(chat_uid, session)
    is_transcript_deleted = await request.app.state.ai_components.vector_db.delete_video_transcript(user_id, youtube_video_url)
    result = await chat_service.delete_chat(chat_uid, session)

    if result and is_transcript_deleted:
        return True



@chats_router.post(
    "/newqa", 
    response_model=ResponseQASchema
)
async def create_new_qa(
    qa_data: CreateQASchema,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    qa_data_dict = qa_data.model_dump()
    new_qa = await chat_service.create_qa(qa_data=qa_data_dict, session=session)
    return new_qa


@chats_router.get(
    "/currentchat/{chat_uid}",
    response_model=ResponseCurrentChatSchema
)
async def get_all_current_chat_data(
    request: Request,
    chat_uid: str,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    youtube_video_url = await chat_service.get_video_url_by_chatid(chat_uid, session)
    user_id = decoded_token_data['sub']
    transcript_exists = await request.app.state.ai_components.vector_db.check_for_transcript(user_id, youtube_video_url)

    result = await chat_service.get_all_qa(chat_uid, session)

    current_chat = {
        "selected_chat_id": chat_uid,
        "youtube_video_url": youtube_video_url,
        "is_transcript_generated": transcript_exists,
        "questions_answers": result
    }
    return current_chat



@chats_router.get("/video/{video_id}")
async def generate_tanscript(
    request: Request,
    video_id: str,
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    user_id = decoded_token_data['sub']
    transcript_exists = await request.app.state.ai_components.vector_db.check_for_transcript(user_id, video_id)
    if  transcript_exists:
        raise TranscriptAlreadyExistError()
    
    data = {
        "user_id": user_id,
        "video_id": video_id
    }

    
    await request.app.state.ai_components.chains['load_store_chain'].ainvoke(data)

    return JSONResponse(
        content="Sucessful"
    )



@chats_router.get("/response/{video_id}/{query}")
async def get_response_from_llm(
    request: Request,
    video_id: str,
    query: str,
    decoded_token_data: Dict = Depends(AccessTokenBearer())
):
    user_id = decoded_token_data['sub']

    transcript_exists = await request.app.state.ai_components.vector_db.check_for_transcript(user_id, video_id)
    if not transcript_exists:
        raise TranscriptDoesNotExistError()
    
    data = {
        "query": query,
        "search_type": "similarity",
        "search_kwargs": {
            "k": 4,
            "filter": {
                "$and" : [
                    {"user_id": user_id},
                    {"video_id": video_id}
                ]
            }
        }
    }

    response = await request.app.state.ai_components.chains['retrieve_response_chain'].ainvoke(data)
    return response
