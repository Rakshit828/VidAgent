from sqlalchemy.ext.asyncio.session import AsyncSession
import sqlalchemy.exc as exc
from .repository import ChatsRepository, VideoInfoRepository


class ChatsService:
    def __init__(self) -> None:
        self._chats_repo = ChatsRepository()
        self._videoinfo_repo = VideoInfoRepository()

    async def create_new_video_and_chat(
        self, session: AsyncSession, video_id: str, user_id: str, chat_title: str
    ) -> None:
        async with session.begin():
            await self._videoinfo_repo.create_new_video_record(
                session=session, video_id=video_id, should_commit=False
            )
            await self._chats_repo.create_new_chat_record(
                session=session,
                user_id=user_id,
                chat_title=chat_title,
                linked_video=video_id,
                should_commit=False,
            )
        return
