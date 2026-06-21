from urllib.parse import urlparse, parse_qs
import re
from typing import ParamSpec, TypeVar, Callable, Awaitable, Any
from src.db.postgres.setup import Session

R = TypeVar("R")
P = ParamSpec("P")


async def wrap_in_session(
    func: Callable[P, Awaitable[R]],
    *args: P.args,
    **kwargs: P.kwargs,
) -> R:
    if kwargs["session"] is not None:
        raise Exception("Cannot Provide session in wrap_in_session. It must be None.")

    async with Session() as async_session:
        kwargs["session"] = async_session
        return await func(*args, **kwargs)


async def wrap_in_transaction(
    func: Callable[P, Awaitable[R]],
    *args: P.args,
    **kwargs: P.kwargs,
) -> Any:
    if "session" in kwargs:
        raise ValueError("Session should not be provided.")
    async with Session() as session:
        kwargs["session"] = session
        async with session.begin():
            return await func(*args, **kwargs)


def get_video_id(url_or_id: str) -> str | None:
    """
    Extracts a YouTube video ID from a URL or returns it if it's already an ID.
    """
    if not url_or_id:
        return None

    # Direct ID
    if re.fullmatch(r"[a-zA-Z0-9_-]{11}", url_or_id):
        return url_or_id

    try:
        parsed = urlparse(url_or_id)
    except Exception:
        return None

    host = parsed.hostname or ""
    path = parsed.path or ""

    # youtube.com/watch?v=xxxx
    if "youtube.com" in host:
        if path == "/watch":
            return parse_qs(parsed.query).get("v", [None])[0]
        # youtube.com/embed/xxxx or youtube.com/shorts/xxxx
        match = re.match(r"^/(embed|shorts)/([a-zA-Z0-9_-]{11})$", path)
        if match:
            return match.group(2)

    # youtu.be/xxxx
    if "youtu.be" in host:
        match = re.match(r"^/([a-zA-Z0-9_-]{11})$", path)
        if match:
            return match.group(1)

    return None
