from sqlmodel import SQLModel, Field, Column, Relationship, text, func
import sqlalchemy.dialects.postgresql as pg
from sqlalchemy import ForeignKey
from uuid import UUID
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List


if TYPE_CHECKING:
    from src.auth.models import Users

class Chats(SQLModel, table=True):
    __tablename__ = "chats"

    uuid: UUID = Field(
        sa_column=Column(
            pg.UUID, primary_key=True, server_default=text("gen_random_uuid()")
        )
    )
    title: str
    youtube_video_url: str
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, server_default=func.now()))

    user_uid: UUID = Field(
        sa_column=Column(
            pg.UUID,
            ForeignKey("users.uuid", ondelete="CASCADE"),  # DB-level cascade
            nullable=False
        )
    )

    # These are the relationship attributes used to join the ORM level classes
    user: Optional["Users"] = Relationship(back_populates="chats")

    questions_answers: List["QuestionsAnswers"] = Relationship(
        back_populates="chat",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


# ----------------- QuestionsAnswers -----------------
class QuestionsAnswers(SQLModel, table=True):
    __tablename__ = "questionsandanswers"

    uuid: UUID = Field(
        sa_column=Column(
            pg.UUID, primary_key=True, server_default=text("gen_random_uuid()")
        )
    )
    query: str
    answer: str

    chat_uid: Optional[UUID] = Field(
        sa_column=Column(
            pg.UUID,
            ForeignKey("chats.uuid", ondelete="CASCADE"),  # DB-level cascade
            nullable=True
        )
    )
    chat: Optional[Chats] = Relationship(back_populates="questions_answers")
