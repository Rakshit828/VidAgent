from urllib.parse import urlparse, parse_qs
import re


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
