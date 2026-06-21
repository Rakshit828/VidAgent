from .setup import Base
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy import String, Boolean, ForeignKey, Index
from sqlalchemy import func
from sqlalchemy.orm import mapped_column, Mapped
from datetime import datetime, timezone
import uuid
from enum import Enum


class VideoProcessingStatusEnum(str, Enum):
    QUEUED = "QUEUED"
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class MessageRoleEnum(str, Enum):
    SYSTEM = "SYSTEM"
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class Users(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(10), default="user", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<Users {self.email}>"


class Videos(Base):
    __tablename__ = "videos"
    id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    yt_video_id: Mapped[str] = mapped_column(pg.TEXT, unique=True, nullable=False)
    video_title: Mapped[str] = mapped_column(pg.TEXT, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(pg.NUMERIC, nullable=True)
    processing_status: Mapped[VideoProcessingStatusEnum] = mapped_column(
        pg.ENUM(VideoProcessingStatusEnum, name="yt_video_processing_status_enum"),
        default=VideoProcessingStatusEnum.QUEUED,
    )
    transcript_text: Mapped[str] = mapped_column(pg.TEXT, nullable=True)
    video_description: Mapped[str] = mapped_column(pg.TEXT, nullable=True)
    lang_code: Mapped[str] = mapped_column(pg.TEXT, nullable=False, default="en")

    created_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_onupdate=func.now(),
    )


class Chats(Base):
    __tablename__ = "chats"
    id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    yt_video_id: Mapped[str] = mapped_column(
        pg.TEXT,
        ForeignKey("videos.yt_video_id", ondelete="RESTRICT"),
    )
    title: Mapped[str] = mapped_column(
        pg.TEXT,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("chats_idx_chat_id_created_at", "id", created_at.desc()),
        Index("chats_idx_youtube_video_id", yt_video_id),
    )


class Messages(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    chat_id: Mapped[uuid.UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        ForeignKey("chats.id", ondelete="CASCADE"),
    )
    role: Mapped[MessageRoleEnum] = mapped_column(
        pg.ENUM(MessageRoleEnum, name="messages_role_enum")
    )
    content: Mapped[str] = mapped_column(pg.TEXT, nullable=False)
    tokens: Mapped[str] = mapped_column(pg.NUMERIC, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        pg.TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("messagses_idx_chat_id_created_at", "chat_id", created_at.desc()),
    )
