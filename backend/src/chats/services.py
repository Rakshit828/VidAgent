from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload
from fastapi import  HTTPException, status

from typing import Dict


from .models import Chats, QuestionsAnswers
from src.auth.models import Users
from src.chats.models import Chats

class ChatServices:
    async def get_all_chats_by_uuid(self, user_uid: str, session: AsyncSession):
        # This is to prevent the lazy loading in async mode
        statement = select(Users).options(selectinload(Users.chats)).where(Users.uuid == user_uid)
        result = await session.exec(statement)
        user = result.first()
        if user:
            return user.chats
        return []


    async def get_chat_by_id(self, chat_uid: str, session: AsyncSession):
        statement = select(Chats).where(Chats.uuid == chat_uid)
        result = await session.exec(statement)
        return result.first()

    async def delete_chat(self, chat_uid: str, session: AsyncSession):
        chat = await self.get_chat_by_id(chat_uid, session)
        await session.delete(chat)
        await session.commit()
        return True

    async def update_chat(self, chat_uid: str, chat_data: Dict, session: AsyncSession):
        chat = await self.get_chat_by_id(chat_uid=chat_uid, session=session)
        if chat:
            for key, value in chat_data.items():
                setattr(chat, key, value)
    
            await session.commit()
            return chat.model_dump()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"Chat not found"})


    async def create_chat(self, user_uid: str, chat_data: Dict, session: AsyncSession):
        chat_data['user_uid'] = user_uid

        # We should have to check for the uuid in the database if necessary

        new_chat = Chats(**chat_data)
        session.add(new_chat)
        await session.commit()
        return new_chat.model_dump()


    async def create_qa(self, qa_data: Dict, session: AsyncSession):
        chat_uid =  qa_data.get('chat_uid')
        chat = await self.get_chat_by_id(chat_uid, session)
        if chat:
            new_qa = QuestionsAnswers(**qa_data)
            session.add(new_qa)
            await session.commit()
            return new_qa
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"Chat does not exists"})



    async def get_all_qa(self, chat_uid: str, session: AsyncSession):
        chat = await self.get_chat_by_id(chat_uid, session)
        if chat is not None:
            statement = select(QuestionsAnswers).where(QuestionsAnswers.chat_uid == chat_uid)
            result = await session.exec(statement)
            return result.all()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"Chat does not exists"})

  
    async def get_video_url_by_chatid(self, chat_uid: str, session: AsyncSession):
        chat = await self.get_chat_by_id(chat_uid, session)
        if chat is not None:
            statement = select(Chats.youtube_video_url).where(Chats.uuid == chat_uid)
            result = await session.exec(statement)
            return result.first()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"Chat does not exists"})
    

chat_service = ChatServices()
