from .setup import Base
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from datetime import datetime, timezone
import uuid


class Users(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), primary_key=True, default_factory=uuid.uuid4
    )
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(10), default="user", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default_factory=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<Users {self.email}>"


class VideoInformation(Base):
    __tablename__ = "video_info"

    video_id: Mapped[str] = mapped_column(pg.TEXT, primary_key=True)
    video_loaded: Mapped[bool] = mapped_column(
        pg.BOOLEAN, nullable=False, default=False
    )
    is_in_vdb: Mapped[bool] = mapped_column(pg.BOOLEAN, nullable=False, default=False)
    transcript_text: Mapped[str] = mapped_column(pg.TEXT)
    video_description: Mapped[str] = mapped_column(pg.TEXT, nullable=True)
    lang_code: Mapped[str] = mapped_column(pg.TEXT, nullable=False, default="en")


class Chats(Base):
    __tablename__ = "chats"
    id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), primary_key=True, default_factory=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    linked_video_id: Mapped[str] = mapped_column(
        pg.TEXT,
        ForeignKey("video_info.video_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        pg.TEXT,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default_factory=lambda: datetime.now(timezone.utc)
    )


class Conversations(Base):
    __tablename__ = "conversations"
    id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), primary_key=True, default_factory=uuid.uuid4
    )
    chat_id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("chats.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_query: Mapped[str] = mapped_column(pg.TEXT, nullable=False)
    assistant_reply: Mapped[str] = mapped_column(pg.TEXT, nullable=True)
