import json
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis
from src.config import CONFIG


_redis_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    """Return a shared async Redis connection (lazy-initialised)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(
            CONFIG.REDIS_URL,
            decode_responses=True,
        )
    return _redis_client


async def publish_workflow_status(
    chat_id: str,
    step: str,
    status: str,
    progress: int,
    message: str,
    extra: dict[str, Any] | None = None,
) -> None:
    """Publish a workflow status payload to the Redis channel ``workflow:{chat_id}``."""
    r = get_redis()
    payload: dict[str, Any] = {
        "chat_id": chat_id,
        "step": step,
        "status": status,
        "progress": progress,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if extra:
        payload.update(extra)

    await r.publish(f"workflow:{chat_id}", json.dumps(payload))
