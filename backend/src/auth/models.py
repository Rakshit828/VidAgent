from __future__ import annotations
from typing import List
from uuid import UUID

from sqlalchemy import String, Boolean, text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
import sqlalchemy.dialects.postgresql as pg

from src.db.postgres_db import Base
from src.chats.models import Chats

class Users(Base):
    __tablename__ = "users"

    uuid: Mapped[UUID] = mapped_column(
        pg.UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )

    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(10), default="user", nullable=False)
    created_at: Mapped[str] = mapped_column(pg.TIMESTAMP, default=func.now())

    chats: Mapped[List[Chats]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Users {self.email}>"
