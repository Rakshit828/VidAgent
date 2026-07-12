from src.db.redis_db import get_redis
from redis.asyncio import Redis
import json
from typing import cast

from .types import SessionMemoryObject


class SessionMemoryService:
    def __init__(self, redis: Redis) -> None:
        self._redis_client = redis

    @classmethod
    async def create(cls) -> "SessionMemoryService":
        redis = get_redis()
        return cls(redis)

    @staticmethod
    def _get_json_str(session_data: SessionMemoryObject) -> str:
        return json.dumps(session_data)

    @staticmethod
    def _get_json_str_to_obj(data_str: str) -> SessionMemoryObject:
        return json.loads(data_str)

    async def save(self, session_id: str, session_data: SessionMemoryObject):
        self._redis_client.lpush(session_id, self._get_json_str(session_data))

    async def retrieve_all(self, session_id: str) -> list[SessionMemoryObject]:
        messages = self._redis_client.get(session_id)
        messages = cast(list[str], messages)
        return [self._get_json_str_to_obj(message_str) for message_str in messages]
