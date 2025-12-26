from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio.session import AsyncSession

from .schemas import (
    CreateQASchema,
    ResponseQASchema,
    CreateChatSchema,
    UpdateChatSchema,
    ResponseChatSchema,
    ResponseChatDataSchema,
)
from .services import chat_service
from src.db.postgres_db import get_session
from src.auth.dependencies import AccessTokenBearer
from typing import Dict, List
from src.ai.exceptions import TranscriptDoesNotExistError, TranscriptAlreadyExistError
from src.ai.agent import AgentContext, AgentState
from src.app_responses import SuccessResponse, AppError

chats_router = APIRouter()


@chats_router.post(
    "/newchat",
    response_model=SuccessResponse[ResponseChatSchema],
    description="Creates a new chat in the database.",
)
async def create_new_chat(
    chat_data: CreateChatSchema,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
) -> SuccessResponse[ResponseChatSchema]:

    user_uid = decoded_token_data["sub"]
    chat_data_dict = chat_data.model_dump()
    new_chat = await chat_service.create_chat(
        user_uid=user_uid, chat_data=chat_data_dict, session=session
    )
    return SuccessResponse[ResponseChatSchema](
        message="Chat created successfully", status_code=201, data=new_chat
    )


@chats_router.get(
    "/allchats",
    response_model=SuccessResponse[List[ResponseChatSchema]],
    description="Returns all the chats of the user. (no questions/answers)",
)
async def get_all_chats(
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
) -> SuccessResponse[List[ResponseChatSchema]]:
    user_uid = decoded_token_data["sub"]
    all_chats = await chat_service.get_all_chats_by_uuid(
        user_uid=user_uid, session=session
    )

    return SuccessResponse[List[ResponseChatSchema]](
        message="All chats fetched successfully", status_code=200, data=all_chats
    )


@chats_router.put(
    "/updatechat/{chat_uid}",
    response_model=SuccessResponse[ResponseChatSchema],
    description="Updates a chat in the database.",
)
async def update_chat(
    chat_uid: str,
    chat_data: UpdateChatSchema,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
) -> SuccessResponse[ResponseChatSchema]:
    chat_data_dict = chat_data.model_dump(exclude_defaults=True)
    updated_chat = await chat_service.update_chat(
        chat_uid=chat_uid, chat_data=chat_data_dict, session=session
    )

    return SuccessResponse[ResponseChatSchema](
        message="Chat updated successfully", status_code=200, data=updated_chat
    )


@chats_router.delete(
    "/delete/{chat_uid}",
    description="Deletes a chat from the database and the video related to it.",
)
async def delete_chat(
    request: Request,
    chat_uid,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
):
    user_id = decoded_token_data["sub"]
    youtube_video_url = await chat_service.get_video_url_by_chatid(chat_uid, session)
    is_transcript_deleted = (
        await request.app.state.components.vector_db.delete_video_transcript(
            user_id, youtube_video_url
        )
    )
    result = await chat_service.delete_chat(chat_uid, session)

    if result and is_transcript_deleted:
        return True


@chats_router.post(
    "/newqa/{chat_uid}",
    response_model=SuccessResponse[ResponseQASchema],
    description="Helps to save the query and the answer to the database.",
)
async def create_new_qa(
    chat_uid: str,
    qa_data: CreateQASchema,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
) -> SuccessResponse[ResponseQASchema]:
    qa_data_dict = qa_data.model_dump()
    new_qa = await chat_service.create_qa(chat_uid=chat_uid, qa_data=qa_data_dict, session=session)
    return SuccessResponse[ResponseQASchema](
        message="QA created successfully", status_code=201, data=new_qa
    )


@chats_router.get(
    "/chat/{chat_uid}",
    response_model=SuccessResponse[ResponseChatDataSchema],
    description="Returns all the chat related data.",
)
async def get_all_current_chat_data(
    request: Request,
    chat_uid: str,
    session: AsyncSession = Depends(get_session),
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
) -> SuccessResponse[ResponseChatDataSchema]:
    youtube_video_url = await chat_service.get_video_url_by_chatid(chat_uid, session)
    user_id = decoded_token_data["sub"]
    transcript_exists = (
        await request.app.state.components.vector_db.check_for_transcript(
            user_id, youtube_video_url
        )
    )

    result = await chat_service.get_all_qa(chat_uid, session)

    current_chat = {
        "selected_chat_id": chat_uid,
        "youtube_video_url": youtube_video_url,
        "is_transcript_generated": transcript_exists,
        "questions_answers": result,
    }

    return SuccessResponse[ResponseChatDataSchema](
        message="Current chat data fetched successfully",
        status_code=200,
        data=current_chat,
    )


@chats_router.post(
    "/video/{video_id}",
    response_model=SuccessResponse[None],
    description="Fetches the video transcript and stores it.",
)
async def fetch_and_store_video(
    request: Request,
    video_id: str,
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
) -> SuccessResponse[None]:
    user_id = decoded_token_data["sub"]
    transcript_exists = (
        await request.app.state.components.vector_db.check_for_transcript(
            user_id, video_id
        )
    )
    if transcript_exists:
        raise AppError(TranscriptAlreadyExistError())

    data = {"user_id": user_id, "video_id": video_id}

    await request.app.state.components.load_and_store_video(**data)

    return SuccessResponse[None](
        message="Transcript generated successfully", status_code=201, data=None
    )


@chats_router.get("/response/{video_id}/{query}")
async def get_response_from_llm(
    request: Request,
    video_id: str,
    query: str,
    decoded_token_data: Dict = Depends(AccessTokenBearer()),
):
    user_id = decoded_token_data["sub"]

    transcript_exists = (
        await request.app.state.components.vector_db.check_for_transcript(
            user_id, video_id
        )
    )
    if not transcript_exists:
        raise TranscriptDoesNotExistError()

    context = {
        "components": request.app.state.components,
        "user_id": user_id,
        "video_id": video_id,
        "chat_id": "adfld7fadfdsf",
    }

    input_state = {"user_query": query}

    async for mode, chunk in request.app.state.agent.run_agent(
        input_state=input_state, context=context
    ):
        if mode == "updates":
            print("Update : ", chunk)
        if mode == "messages":
            print(chunk[0].content, end="", flush=True)

    return "Agent is running"

    # return StreamingResponse(
    #     request.app.state.agent.run_agent(input_state=input_state, context=context),
    #     media_type="event/stream"
    # )
