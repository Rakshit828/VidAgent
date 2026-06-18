from __future__ import annotations
from loguru import logger
from .base import BaseSerpApiClient
from .types import YouTubeTranscriptResponse, YouTubeVideoResponse
from src.config import CONFIG


class YouTubeClient(BaseSerpApiClient):

    async def get_video(
        self,
        video_id: str,
        *,
        hl: str | None = None,
        gl: str | None = None,
        next_page_token: str | None = None,
    ) -> YouTubeVideoResponse:

        params = {"v": video_id}

        if hl:
            params["hl"] = hl

        if gl:
            params["gl"] = gl

        if next_page_token:
            params["next_page_token"] = next_page_token

        data = await self.request(
            engine=CONFIG.YOUTUBE_VIDEO_ENGINE,
            params=params,
        )

        logger.debug(f"The raw data is : {data}")

        return YouTubeVideoResponse.model_validate(data)

    async def get_transcript(
        self,
        video_id: str,
        *,
        language_code: str | None = None,
        transcript_type: str | None = None,
        title: str | None = None,
    ) -> YouTubeTranscriptResponse:

        params = {
            "v": video_id,
        }

        if language_code:
            params["language_code"] = language_code

        if transcript_type:
            params["type"] = transcript_type

        if title:
            params["title"] = title

        data = await self.request(
            engine=CONFIG.YOUTUBE_VIDEO_TRANSCRIPT_ENGINE,
            params=params,
        )

        logger.debug(f"The raw data is : {data}")

        return YouTubeTranscriptResponse.model_validate(data)
