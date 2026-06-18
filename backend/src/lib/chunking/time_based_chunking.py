from __future__ import annotations

from typing import List, Optional

from src.lib.chunking.base import ChunkingStrategy
from src.lib.chunking.common import (
    Chunk,
    ChunkingStrategyName,
    find_chapter_for_range,
    ms_to_timestamp,
    normalize_snippets,
)
from src.lib.scraper.types import (
    TranscriptSnippet,
    YouTubeTranscriptResponse,
    YouTubeVideoResponse,
)


class TimeBasedChunking(ChunkingStrategy):
    """Baseline time-based chunking.

    Supports two modes, both driven by wall-clock time on the transcript
    rather than sentence/semantic boundaries:

    1. Fixed Window — non-overlapping chunks of `window_seconds` length.
       e.g. window_seconds=60 -> [0-60s], [60-120s], [120-180s], ...

    2. Sliding Window with Overlap — chunks of `window_seconds` length where
       each new chunk starts `window_seconds - overlap_seconds` after the
       previous one, so consecutive chunks share `overlap_seconds` of
       transcript. This reduces "boundary loss" where a sentence/answer gets
       split across two chunks with no shared context.

    Both modes operate purely on snippet timestamps and concatenate whatever
    snippet text falls (even partially) inside the window. Text is NOT
    sentence-aware here by design — that's what SentenceBasedChunking is for.
    """

    def __init__(
        self,
        window_seconds: int = 60,
        overlap_seconds: int = 0,
        min_chunk_seconds: float = 5.0,
    ) -> None:
        """
        Args:
            window_seconds: Length of each chunk, in seconds. (e.g. 30, 60, 120)
            overlap_seconds: Overlap between consecutive chunks, in seconds.
                0 -> Fixed Window mode. >0 -> Sliding Window mode.
                Must be strictly less than window_seconds.
            min_chunk_seconds: Drop a trailing chunk shorter than this many
                seconds (avoids a near-empty final chunk when the video
                length doesn't divide evenly into windows).
        """
        if window_seconds <= 0:
            raise ValueError("window_seconds must be positive")
        if overlap_seconds < 0:
            raise ValueError("overlap_seconds cannot be negative")
        if overlap_seconds >= window_seconds:
            raise ValueError(
                "overlap_seconds must be strictly less than window_seconds"
            )

        self.window_ms = window_seconds * 1000
        self.overlap_ms = overlap_seconds * 1000
        self.min_chunk_ms = int(min_chunk_seconds * 1000)
        self.step_ms = self.window_ms - self.overlap_ms

    @property
    def _strategy_name(self) -> ChunkingStrategyName:
        return (
            ChunkingStrategyName.TIME_SLIDING_WINDOW
            if self.overlap_ms > 0
            else ChunkingStrategyName.TIME_FIXED_WINDOW
        )

    async def chunk(
        self,
        transcript_data: YouTubeTranscriptResponse,
        video_response: YouTubeVideoResponse | None = None,
    ) -> List[Chunk]:
        snippets = normalize_snippets(transcript_data.transcript)
        if not snippets:
            return []

        video_end_ms = snippets[-1].end_ms or snippets[-1].start_ms
        video_start_ms = snippets[0].start_ms

        windows = self._build_windows(video_start_ms, video_end_ms)
        chunks: List[Chunk] = []

        for idx, (win_start, win_end) in enumerate(windows):
            text, snippet_start, snippet_end = self._collect_text_for_window(
                snippets, win_start, win_end
            )
            if not text:
                continue

            # Report the NOMINAL window boundaries, not the timestamps of
            # whichever snippets happened to be included. The nominal
            # boundaries are exact and constant (every window is exactly
            # `window_seconds` long, every step is exactly `step_ms`), so
            # `overlap_ms` between consecutive chunks is always exactly
            # `overlap_seconds` * 1000 — no jitter from snippet length.
            #
            # Snippet-snapped timestamps are still useful for debugging
            # (e.g. confirming there's real transcript content right up to
            # the edges), so they're kept in metadata rather than discarded.
            duration_ms = win_end - win_start
            if duration_ms < self.min_chunk_ms and idx == len(windows) - 1:
                # Skip a sliver-thin trailing window (e.g. last 3s of a video).
                continue

            chunk_overlap_ms = self.overlap_ms if idx > 0 else 0

            chunks.append(
                Chunk(
                    chunk_index=idx,
                    text=text,
                    start_ms=win_start,
                    end_ms=win_end,
                    start_time_text=ms_to_timestamp(win_start),
                    end_time_text=ms_to_timestamp(win_end),
                    chapter=find_chapter_for_range(
                        transcript_data.chapters, win_start, win_end
                    ),
                    strategy=self._strategy_name,
                    overlap_ms=chunk_overlap_ms,
                    metadata={
                        "window_seconds": self.window_ms // 1000,
                        "overlap_seconds": self.overlap_ms // 1000,
                        "snippet_start_ms": snippet_start,
                        "snippet_end_ms": snippet_end,
                    },
                )
            )

        # Re-index sequentially in case any windows were skipped above.
        for i, c in enumerate(chunks):
            c.chunk_index = i

        return chunks

    def _build_windows(
        self, video_start_ms: int, video_end_ms: int
    ) -> List[tuple[int, int]]:
        """Compute the (start_ms, end_ms) boundaries for every window.

        Fixed mode (overlap=0): windows are contiguous and non-overlapping.
        Sliding mode (overlap>0): each window starts `step_ms` after the
        previous window's start, so it shares `overlap_ms` with it.
        """
        windows: List[tuple[int, int]] = []
        win_start = video_start_ms
        while win_start < video_end_ms:
            win_end = min(win_start + self.window_ms, video_end_ms)
            windows.append((win_start, win_end))
            if win_end >= video_end_ms:
                break
            win_start += self.step_ms
        return windows

    def _collect_text_for_window(
        self,
        snippets: List[TranscriptSnippet],
        win_start: int,
        win_end: int,
    ) -> tuple[str, Optional[int], Optional[int]]:
        """Select every snippet that "belongs" to [win_start, win_end).

        Two different inclusion rules are used depending on mode, because
        they answer different questions:

        - Fixed mode (overlap_ms == 0): a snippet must belong to exactly
          ONE window — there is no overlap, so no snippet should ever be
          duplicated across chunks. We assign a snippet to a window based
          on its MIDPOINT falling inside [win_start, win_end). This avoids
          the bug where a snippet straddling a boundary (e.g. start=118000,
          end=121067 against a 120000ms cut point) would otherwise satisfy
          the naive "any overlap" test for BOTH windows and get duplicated
          — which is exactly what produced spurious ~3s "overlap" even
          with overlap_seconds=0.

        - Sliding mode (overlap_ms > 0): overlap is intentional, so we use
          an "any intersection" test — a snippet is included if any part of
          its [start_ms, end_ms) range intersects the window. Boundary
          snippets are expected to appear in two consecutive windows here;
          that's the entire point of sliding windows (reduced boundary
          loss). The reported `overlap_ms` on the resulting Chunk reflects
          the configured overlap, not just this incidental snippet sharing.

        Returns the joined text plus the actual start/end ms spanned by the
        included snippets (which may be tighter — or, in sliding mode,
        slightly wider — than the nominal window if the transcript has
        gaps or boundary-straddling snippets). These snippet-snapped values
        are informational only; the Chunk's reported start_ms/end_ms use
        the nominal window boundaries instead, so overlap stays exact.
        """

        if self.overlap_ms == 0:

            included: List[TranscriptSnippet] = [
                s
                for s in snippets
                # The pylance error is baseless bcz: _normalize_snippets() already fills end_ms
                if win_start <= (s.start_ms + s.end_ms) // 2 < win_end
            ]
        else:
            included = [
                s for s in snippets if s.start_ms < win_end and s.end_ms > win_start
            ]

        if not included:
            return "", None, None

        text = " ".join(s.snippet for s in included)
        actual_start = included[0].start_ms
        actual_end = included[-1].end_ms
        return text, actual_start, actual_end
