from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from typing import Dict

from .exceptions import ChatNotFoundError
from .models import Chats, QuestionsAnswers
from src.auth.models import Users
from src.chats.models import Chats
from src.app_responses import AppError


class ChatServices:
    async def get_all_chats_by_uuid(self, user_uid: str, session: AsyncSession) -> list[Chats]:
        statement = select(Chats).where(Chats.user_uid == user_uid)
        result = await session.execute(statement)
        list_of_chats = result.scalars().all()
        if list_of_chats:
            return list_of_chats
        return []


    async def get_chat_by_id(self, chat_uid: str, session: AsyncSession) -> Chats | None:
        statement = select(Chats).where(Chats.uuid == chat_uid)
        result = await session.execute(statement)
        return result.scalar_one_or_none()

    async def delete_chat(self, chat_uid: str, session: AsyncSession):
        chat = await self.get_chat_by_id(chat_uid, session)
        if chat is None:
            raise AppError(ChatNotFoundError[None]())

        await session.delete(chat)
        await session.commit()
        return True

    async def update_chat(self, chat_uid: str, chat_data: Dict, session: AsyncSession) -> Chats:
        chat = await self.get_chat_by_id(chat_uid=chat_uid, session=session)
        if chat:
            for key, value in chat_data.items():
                setattr(chat, key, value)

            await session.commit()
            return chat
        raise AppError(ChatNotFoundError[None]())

    async def create_chat(self, user_uid: str, chat_data: Dict, session: AsyncSession) -> Chats:
        chat_data["user_uid"] = user_uid

        # We should have to check for the uuid in the database if necessary

        new_chat: Chats = Chats(**chat_data)
        session.add(new_chat)
        await session.commit()
        return new_chat

    async def create_qa(self, chat_uid: str, qa_data: Dict, session: AsyncSession):
        chat = await self.get_chat_by_id(chat_uid, session)
        if chat:
            new_qa = QuestionsAnswers(**qa_data, chat_uid=chat_uid)
            session.add(new_qa)
            await session.commit()
            return new_qa
        
        raise AppError(ChatNotFoundError[None]())


    async def get_all_qa(self, chat_uid: str, session: AsyncSession) -> list[QuestionsAnswers]:
        statement = select(QuestionsAnswers).where(
            QuestionsAnswers.chat_uid == chat_uid
        )
        result = await session.execute(statement)
        questions_answers = result.scalars().all()
        return questions_answers
        

    async def get_video_url_by_chatid(self, chat_uid: str, session: AsyncSession) -> str | None :
        chat = await self.get_chat_by_id(chat_uid, session)
        if chat is not None:
            statement = select(Chats.youtube_video_url).where(Chats.uuid == chat_uid)
            result = await session.execute(statement)
            return result.scalar_one_or_none()
        raise AppError(ChatNotFoundError[None]())




chat_service = ChatServices()
