from sqlmodel import SQLModel, Field, Column, Relationship, text
import sqlalchemy.dialects.postgresql as pg
from datetime import datetime
from uuid import UUID
from pydantic import EmailStr
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from src.chats.models import Chats


class Users(SQLModel, table=True):
    __tablename__ = "users"

    uuid: UUID = Field(
        sa_column=Column(
            pg.UUID, primary_key=True, server_default=text("gen_random_uuid()")
        )
    )
    first_name: str
    last_name: str
    email: EmailStr
    username: str
    hashed_password: str
    is_verified: bool = False
    role: str = "user"
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))

    # ORM-level cascade; DB-level handled in Chats
    chats: List["Chats"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    def __repr__(self):
        return f"<class Users {self.email}>"
