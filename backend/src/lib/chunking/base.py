from abc import ABC, abstractmethod
from src.lib.scraper.types import YouTubeTranscriptResponse, YouTubeVideoResponse
from typing import Any


class ChunkingStrategy(ABC):
    @abstractmethod
    async def chunk(
        self,
        transcript_data: YouTubeTranscriptResponse,
        video_response: YouTubeVideoResponse,
    ) -> Any: ...
