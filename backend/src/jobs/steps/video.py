from src.lib.scraper.yt import YouTubeClient
from src.lib.scraper.types import YouTubeTranscriptResponse, YouTubeVideoResponse
from .types import (
    GetVideoTranscriptStepInput,
    GetVideoTranscriptStepOutput,
    ChunkTranscriptStepOutputElement,
    ChunkTranscriptStepInput,
    StoreChunksInVDBStepInput,
    StoreChunksInVDBStepOutput,
    UpdateVideoInfoStepInput,
    UpdateVideoInfoStepOutput,
)
from src.lib.chunking.time_based_chunking import TimeBasedChunking
from src.lib.weviate_db.service import WeaviateService
from src.lib.weviate_db.client import WeaviateClient
from src.lib.weviate_db.types import YoutubeInfoCollectionObject
from src.domains.chats.repository import VideoInfoRepository
from src.utils import wrap_in_session
from typing import Dict
from uuid import UUID


async def get_video_transcript(
    inputs: GetVideoTranscriptStepInput,
) -> GetVideoTranscriptStepOutput:
    yt_client = YouTubeClient()
    result: YouTubeTranscriptResponse = await yt_client.get_transcript(
        video_id=inputs["video_id"], language_code=inputs.get("language_code", None)
    )
    return GetVideoTranscriptStepOutput(**result.model_dump())


async def chunk_transcript(
    inputs: ChunkTranscriptStepInput,
) -> list[ChunkTranscriptStepOutputElement]:
    chunker = TimeBasedChunking(window_seconds=120, overlap_seconds=10)
    data = {}
    if inputs.get("video_data", None) is not None:
        data["video_response"] = YouTubeVideoResponse.model_validate(
            inputs["video_data"]
        )
    data["transcript_data"] = YouTubeTranscriptResponse.model_validate(
        inputs["transcript_data"]
    )

    result = await chunker.chunk(**data)

    return [ChunkTranscriptStepOutputElement(**chunk.model_dump()) for chunk in result]


async def store_chunks_in_vdb(
    inputs: StoreChunksInVDBStepInput,
) -> StoreChunksInVDBStepOutput:
    wv_client = await WeaviateClient.create()
    wv_service = WeaviateService(wv_client=wv_client)

    objs = [
        YoutubeInfoCollectionObject(
            chunk=chunk["text"],
            video_id=str(inputs["yt_video_id"]),
            chunk_start_sec=chunk["start_ms"] // 1000,
            chunk_end_sec=chunk["start_ms"] // 1000,
        )
        for chunk in inputs["chunks"]
    ]
    output: Dict[int, UUID] = await wv_service.insert_into_db(documents=objs)

    outputs = {k: str(v) for k, v in output.items()}

    return StoreChunksInVDBStepOutput(data=outputs)


async def update_video_info(inputs: UpdateVideoInfoStepInput):
    repo = VideoInfoRepository()
    video = await wrap_in_session(
        repo.update_video_info,
        session=None,
        yt_video_id=inputs["yt_video_id"],
        duration=inputs["duration_secs"],
        transcript=inputs["transcript"],
    )
    assert video
    return UpdateVideoInfoStepOutput(
        video_id=str(video.id),
        yt_video_id=str(video.yt_video_id),
        processing_status=video.processing_status,
    )
