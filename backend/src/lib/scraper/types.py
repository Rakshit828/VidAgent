from __future__ import annotations

from pydantic import BaseModel
from typing import List


class TranscriptSnippet(BaseModel):
    snippet: str
    start_ms: int
    end_ms: int | None = None
    start_time_text: str | None = None


class TranscriptChapter(BaseModel):
    chapter: str
    start_ms: int
    end_ms: int


class AvailableTranscript(BaseModel):
    language_code: str
    type: str
    language_name: str | None = None
    selected: bool | None = None
    title: str | None = None
    serpapi_link: str | None = None


class YouTubeTranscriptResponse(BaseModel):
    transcript: List[TranscriptSnippet]
    chapters: List[TranscriptChapter] | None = None
    available_transcripts: List[AvailableTranscript] | None = None


class LinkElement(BaseModel):
    start_index: int
    length: int
    text: str
    url: str


class ChapterElement(BaseModel):
    title: str
    time_start: int


class VideoDescription(BaseModel):
    content: str
    links: List[LinkElement] | None = None


class YouTubeVideoResponse(BaseModel):
    model_config = {
        "extra": "allow",
    }
    title: str
    description: VideoDescription
    chapters: List[ChapterElement] | None = None
