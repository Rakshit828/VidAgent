from sqlalchemy.ext.asyncio.session import AsyncSession
from src.db.postgres.schemas import Chats, VideoInformation
from sqlalchemy import insert
import sqlalchemy.dialects.postgresql as pg


class VideoInfoRepository:
    async def create_new_video_record(
        self, session: AsyncSession, video_id: str, should_commit: bool = True
    ) -> None:
        stmt = (
            pg.insert(VideoInformation)
            .values({"video_id": video_id})
            .on_conflict_do_nothing(index_elements=["video_id"])
        )

        await session.execute(stmt)
        if should_commit:
            await session.commit()
        return


class ChatsRepository:
    async def create_new_chat_record(
        self,
        session: AsyncSession,
        user_id: str,
        chat_title: str,
        linked_video: str,
        should_commit: bool = True,
    ):
        stmt = insert(Chats).values(
            {"user_id": user_id, "linked_video_id": linked_video, "title": chat_title}
        )
        await session.execute(stmt)
        if should_commit:
            await session.commit()
        return
