from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from src.config import CONFIG

# Async engine
async_engine = create_async_engine(
    url=CONFIG.DATABASE_URL,
)

# Async Session
Session = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db():
    async with async_engine.begin() as conn:
        from src.auth.models import Users
        from src.chats.models import Chats, QuestionsAnswers
        await conn.run_sync(SQLModel.metadata.create_all)


# Dependency for FastAPI
async def get_session():
    async with Session() as session:
        yield session
