from __future__ import annotations

from enum import Enum
from typing import List, Optional, Any

from pydantic import BaseModel

from src.lib.scraper.types import TranscriptChapter, TranscriptSnippet


class ChunkingStrategyName(str, Enum):
    TIME_FIXED_WINDOW = "time_fixed_window"
    TIME_SLIDING_WINDOW = "time_sliding_window"

    # Not yet implemented
    SENTENCE_PURE = "sentence_pure"
    SENTENCE_OVERLAP = "sentence_overlap"
    SENTENCE_TIME_WINDOW = "sentence_time_window"


class Chunk(BaseModel):
    """Standardized output unit for every chunking strategy.

    Even though `ChunkingStrategy.chunk()` is typed to return `Any`, every
    concrete strategy in this module returns `List[Chunk]` so that the rest
    of the RAG pipeline (embedding, indexing, citation) has one uniform shape
    to work with, regardless of which strategy produced it.
    """

    chunk_index: int
    text: str
    start_ms: int
    end_ms: int
    start_time_text: str
    end_time_text: str
    chapter: Optional[str] = None
    strategy: ChunkingStrategyName
    # Number of leading ms in this chunk's text that are duplicated from the
    # previous chunk (sliding window / sentence overlap). Useful downstream
    # if you ever want to de-dupe overlapping text before showing citations.
    overlap_ms: int = 0
    metadata: dict[str, Any] = {}


def ms_to_timestamp(ms: int) -> str:
    """Format milliseconds as H:MM:SS or M:SS text, matching YouTube's own style."""
    total_seconds = max(0, ms) // 1000
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def normalize_snippets(snippets: List[TranscriptSnippet]) -> List[TranscriptSnippet]:
    """Fill in missing `end_ms` values and drop empty/whitespace-only snippets.

    Caption tracks frequently omit `end_ms`; the conventional fallback is the
    next snippet's `start_ms`. The final snippet, if still missing `end_ms`,
    gets a synthetic small duration so it isn't zero-length.
    """
    cleaned = [s for s in snippets if s.snippet and s.snippet.strip()]
    cleaned.sort(key=lambda s: s.start_ms)

    normalized: List[TranscriptSnippet] = []
    for i, s in enumerate(cleaned):
        end_ms = s.end_ms
        if end_ms is None:
            if i + 1 < len(cleaned):
                end_ms = cleaned[i + 1].start_ms
            else:
                end_ms = s.start_ms + 2000  # fallback duration for the last snippet
        # Guard against malformed data where end <= start.
        if end_ms <= s.start_ms:
            end_ms = s.start_ms + 1
        normalized.append(
            TranscriptSnippet(
                snippet=s.snippet.strip(),
                start_ms=s.start_ms,
                end_ms=end_ms,
                start_time_text=s.start_time_text,
            )
        )
    return normalized


# The chapter here is currently only used in metadata. Not as a pure chunking strategy.
def find_chapter_for_range(
    chapters: Optional[List[TranscriptChapter]], start_ms: int, end_ms: int
) -> Optional[str]:
    """Return the title of whichever chapter the chunk's midpoint falls into.

    Using the midpoint (rather than start_ms) gives a more representative
    label for chunks that straddle a chapter boundary.

    Defensive against malformed chapter data: `TranscriptChapter.end_ms`
    (and even `start_ms`) is declared as a required `int` in the schema,
    but in practice some sources leave the *last* chapter's end open
    (None) since they don't know where the video actually ends. Any
    chapter with a None start_ms or end_ms is treated as open-ended rather
    than causing a comparison crash.
    """
    if not chapters:
        return None
    midpoint = (start_ms + end_ms) // 2

    for i, chapter in enumerate(chapters):
        c_start = chapter.start_ms
        if chapter.end_ms is not None:
            c_end = chapter.end_ms

        elif i + 1 < len(chapters):
            # Open-ended chapter: treat its end as wherever the next
            # chapter starts.
            c_end = chapters[i + 1].start_ms
        else:
            # Last chapter with no known end — treat as open-ended to +inf.
            c_end = float("inf")

        if c_start <= midpoint < c_end:
            return chapter.chapter

    # Fallback: clamp to the last chapter if midpoint is past every boundary
    # (can happen if chapter end_ms data is slightly off from actual video length).

    last_start = chapters[-1].start_ms
    if midpoint >= last_start:
        return chapters[-1].chapter

    return None
