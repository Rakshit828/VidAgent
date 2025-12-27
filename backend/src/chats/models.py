from sqlalchemy.orm.util import CascadeOptions
from asyncpg.exceptions._base import FatalPostgresError
from jedi.inference.arguments import TreeArguments
from __future__ import annotations
from typing import Optional, List, TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, text, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
import sqlalchemy.dialects.postgresql as pg

from src.db.postgres_db import Base

if TYPE_CHECKING:
    from src.auth.models import Users


class Chats(Base):
    __tablename__ = "chats"

    uuid: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    title: Mapped[str] = mapped_column(pg.VARCHAR(50), nullable=False)
    youtube_video_url: Mapped[str] = mapped_column(pg.VARCHAR(50), nullable=False)
    created_at: Mapped[Optional[str]] = mapped_column(pg.TIMESTAMP, server_default=func.now())

    user_uid: Mapped[UUID] = mapped_column(
        pg.UUID,
        ForeignKey("users.uuid", ondelete="CASCADE"),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_user_uid", "user_uid"),
        Index("idx_chat_id", "uuid"),
    )

    user: Mapped[Optional["Users"]] = relationship(back_populates="chats")

    questions_answers: Mapped[List["QuestionsAnswers"]] = relationship(
        back_populates="chat",
        cascade="all, delete-orphan",
    )



class QuestionsAnswers(Base):
    __tablename__ = "questionsandanswers"

    uuid: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    query: Mapped[Optional[str]] = mapped_column(pg.TEXT)
    answer: Mapped[Optional[str]] = mapped_column(pg.TEXT)

    chat_uid: Mapped[Optional[UUID]] = mapped_column(
        pg.UUID,
        ForeignKey("chats.uuid", ondelete="CASCADE"),
        nullable=True,
    )

    __table_args__ = (
        Index("idx_chat_uid", "chat_uid"), 
    )


    chat: Mapped[Optional[Chats]] = relationship(back_populates="questions_answers")
    