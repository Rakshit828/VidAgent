from sqlalchemy.ext.asyncio.session import AsyncSession
from src.db.postgres.schemas import Chats, Videos, VideoProcessingStatusEnum
from sqlalchemy import insert
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy import select, update
from loguru import logger


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
