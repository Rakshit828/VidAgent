from typing import TypedDict, List, Optional, Any, Dict
from src.lib.chunking.common import ChunkingStrategyName
from src.db.postgres.schemas import VideoProcessingStatusEnum

class GetVideoTranscriptStepInput(TypedDict):
    video_id: str
    language_code: str | None


class TranscriptSnippet(TypedDict):
    snippet: str
    start_ms: int
    end_ms: int | None
    start_time_text: str | None


class TranscriptChapter(TypedDict):
    chapter: str
    start_ms: int
    end_ms: int | None


class AvailableTranscript(TypedDict):
    language_code: str
    type: str | None
    language_name: str | None
    selected: bool | None
    title: str | None
    serpapi_link: str | None


class LinkElement(TypedDict):
    start_index: int
    length: int
    text: str
    url: str


class ChapterElement(TypedDict):
    title: str
    time_start: int


class VideoDescription(TypedDict):
    content: str
    links: List[LinkElement] | None


class GetVideoTranscriptStepOutput(TypedDict):
    transcript: List[TranscriptSnippet]
    chapters: List[TranscriptChapter] | None
    available_transcripts: List[AvailableTranscript] | None


class GetVideoInfoStepOutput(TypedDict):
    title: str
    description: VideoDescription
    chapters: List[ChapterElement] | None


class ChunkTranscriptStepInput(TypedDict):
    transcript_data: GetVideoTranscriptStepOutput
    video_data: GetVideoInfoStepOutput | None


class ChunkTranscriptStepOutputElement(TypedDict):
    chunk_index: int
    text: str
    start_ms: int
    end_ms: int
    start_time_text: str
    end_time_text: str
    chapter: Optional[str]
    strategy: ChunkingStrategyName
    overlap_ms: int
    metadata: dict[str, Any]


class StoreChunksInVDBStepInput(TypedDict):
    chunks: List[ChunkTranscriptStepOutputElement]
    yt_video_id: str


class StoreChunksInVDBStepOutput(TypedDict):
    data: Dict[int, str]


class UpdateVideoInfoStepInput(TypedDict):
    yt_video_id: str
    duration_secs: int
    transcript: str


class UpdateVideoInfoStepOutput(TypedDict):
    video_id: str
    yt_video_id: str
    processing_status: VideoProcessingStatusEnum
