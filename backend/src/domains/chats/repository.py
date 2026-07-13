from sqlalchemy.ext.asyncio.session import AsyncSession
from src.db.postgres.schemas import (
    Chats,
    Videos,
    VideoProcessingStatusEnum,
    MessageRoleEnum,
    Messages,
)
from sqlalchemy import insert
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy import select, update, delete
from loguru import logger
from typing import Any



class VideoInfoRepository:
    async def get_video_info_by_id(
        self, session: AsyncSession | None, yt_video_id: str
    ) -> Videos | None:
        if session is None:
            raise Exception(f"Session cannot be None.")

        stmt = select(Videos).where(Videos.yt_video_id == yt_video_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_new_video_record(
        self,
        session: AsyncSession,
        yt_video_id: str,
        should_commit: bool = True,
    ) -> Videos | None:
        video = await self.get_video_info_by_id(
            session=session, yt_video_id=yt_video_id
        )

        if video is not None:
            return video

        stmt = (
            pg.insert(Videos)
            .values({"yt_video_id": yt_video_id})
            .on_conflict_do_nothing(index_elements=["yt_video_id"])
            .returning(Videos)
        )

        result = await session.execute(stmt)
        video = result.scalar_one_or_none()

        try:
            assert video
        except AssertionError as e:
            logger.info(f"Assertion Error. {str(e)}")
            return None

        if should_commit:
            await session.commit()

        return video

    async def update_video_info(
        self,
        session: AsyncSession,
        yt_video_id: str,
        title: str | None = None,
        description: str | None = None,
        duration: int | None = None,
        processing_status: VideoProcessingStatusEnum = VideoProcessingStatusEnum.COMPLETED,
        transcript: str | None = None,
        lang_code: str | None = None,
    ):
        values = {}
        values["processing_status"] = processing_status
        if title:
            values["video_title"] = title
        if description:
            values["video_description"] = description
        if duration:
            values["duration_seconds"] = duration
        if lang_code:
            values["lang_code"] = lang_code
        if transcript:
            values["transcript_text"] = transcript

        stmt = (
            update(Videos)
            .where(Videos.yt_video_id == yt_video_id)
            .values(**values)
            .returning(Videos)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


class ChatsRepository:
    async def create_new_chat_record(
        self,
        session: AsyncSession,
        user_id: str,
        chat_title: str,
        linked_video: str,
        should_commit: bool = True,
    ) -> Chats | None:
        stmt = (
            insert(Chats)
            .values(
                {"user_id": user_id, "yt_video_id": linked_video, "title": chat_title}
            )
            .returning(Chats)
        )

        chat = (await session.execute(stmt)).scalar_one_or_none()

        if should_commit:
            await session.commit()

        return chat if chat is not None else None


class MessagesRepository:
    async def create_new_message_record(
        self,
        session: AsyncSession,
        chat_id: str,
        role: MessageRoleEnum,
        content: str,
        tokens: int,
        should_commit: bool = True,
    ) -> Messages | None:
        stmt = (
            insert(Messages)
            .values(
                {
                    "chat_id": chat_id,
                    "role": role,
                    "content": content,
                    "tokens": tokens,
                }
            )
            .returning(Messages)
        )

        message = (await session.execute(stmt)).scalar_one_or_none()

        if should_commit:
            await session.commit()

        return message if message is not None else None

    async def get_message_by_id(
        self,
        session: AsyncSession,
        message_id: str,
    ) -> Messages | None:
        stmt = select(Messages).where(Messages.id == message_id)

        return (await session.execute(stmt)).scalar_one_or_none()

    async def get_messages_by_chat_id(
        self,
        session: AsyncSession,
        chat_id: str,
    ) -> list[Messages]:
        stmt = (
            select(Messages)
            .where(Messages.chat_id == chat_id)
            .order_by(Messages.created_at.asc())
        )

        return list((await session.execute(stmt)).scalars().all())

    async def update_message(
        self,
        session: AsyncSession,
        message_id: str,
        *,
        content: str | None = None,
        tokens: int | None = None,
        role: MessageRoleEnum | None = None,
        should_commit: bool = True,
    ) -> Messages | None:
        values: dict[str, Any] = {}

        if content is not None:
            values["content"] = content

        if tokens is not None:
            values["tokens"] = tokens

        if role is not None:
            values["role"] = role

        if not values:
            return await self.get_message_by_id(session, message_id)

        stmt = (
            update(Messages)
            .where(Messages.id == message_id)
            .values(values)
            .returning(Messages)
        )

        message = (await session.execute(stmt)).scalar_one_or_none()

        if should_commit:
            await session.commit()

        return message

    async def delete_message(
        self,
        session: AsyncSession,
        message_id: str,
        should_commit: bool = True,
    ) -> bool:
        stmt = delete(Messages).where(Messages.id == message_id).returning(Messages.id)

        deleted = (await session.execute(stmt)).scalar_one_or_none()

        if should_commit:
            await session.commit()

        return deleted is not None

    async def delete_messages_by_chat_id(
        self,
        session: AsyncSession,
        chat_id: str,
        should_commit: bool = True,
    ) -> int:
        stmt = (
            delete(Messages).where(Messages.chat_id == chat_id).returning(Messages.id)
        )

        deleted_count = len((await session.execute(stmt)).scalars().all())

        if should_commit:
            await session.commit()

        return deleted_count
