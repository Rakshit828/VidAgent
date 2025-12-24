from typing import List
from pydantic import BaseModel, Field
from .video_loader import TranscriptResponse
from uuid import uuid4

class TranscriptChunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    start_time: float
    end_time: float
    text: str
    video_id: str


class TranscriptPreprocessor:

    async def group_transcript_into_chunks(
        self, video_id: str, transcript: List[TranscriptResponse], interval_seconds: int = 60
    ) -> List[TranscriptChunk]:
        """
        Groups transcript segments into chunks based on a time interval.
        
        Args:
            transcript: List of TranscriptResponse objects.
            interval_seconds: Duration of each chunk in seconds.
            
        Returns:
            List of TranscriptChunk objects with grouped text and time ranges.
        """
        if not transcript:
            return []

        chunks: List[TranscriptChunk] = []

        current_chunk_start = transcript[0].offset
        current_text_parts = []
        
        for item in transcript:
            if item.offset >= current_chunk_start + interval_seconds:
                if current_text_parts:
                    chunks.append(TranscriptChunk(
                        start_time=current_chunk_start,
                        end_time=item.offset,
                        text=" ".join(current_text_parts),
                        video_id=video_id
                    ))
                
                current_chunk_start = item.offset
                current_text_parts = [item.text]
            else:
                current_text_parts.append(item.text)
        

        if current_text_parts:
            last_item = transcript[-1]
            chunks.append(TranscriptChunk(
                start_time=current_chunk_start,
                end_time=last_item.offset + last_item.duration,
                text=" ".join(current_text_parts),
                video_id=video_id
            ))
            
        return chunks

