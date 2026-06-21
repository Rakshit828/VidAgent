import inngest

from src.services.inngest_client import inngest_client

from .config import InngestEventsEnum
from src.jobs.steps.video import (
    get_video_transcript,
    chunk_transcript,
    store_chunks_in_vdb,
    update_video_info,
    UpdateVideoInfoStepInput,
    UpdateVideoInfoStepOutput,
    StoreChunksInVDBStepInput,
    StoreChunksInVDBStepOutput,
    ChunkTranscriptStepInput,
    ChunkTranscriptStepOutputElement,
    GetVideoTranscriptStepInput,
    GetVideoTranscriptStepOutput,
)
from src.db.redis_db import publish_workflow_status
from src.lib.scraper.exceptions import SerpApiResponseError
from loguru import logger


@inngest_client.create_function(
    fn_id="chat-created-workflow",
    trigger=inngest.TriggerEvent(event=InngestEventsEnum.CHAT_CREATED),
    idempotency="event.data.video_id",
)
async def process_video_workflow(ctx: inngest.Context) -> None:
    logger.info(ctx.event)
    step = ctx.step

    video_id = ctx.event.data["video_id"]
    chat_id = ctx.event.data["chat_id"]
    yt_video_id = ctx.event.data["yt_video_id"]

    logger.info(
        f"[Video_id]: {video_id}, [Chat_id]: {chat_id}, [yt_video_id]: {yt_video_id}"
    )

    try:
        # ── Step 1: Fetch transcript ───────────────────────────────────
        await publish_workflow_status(
            chat_id=str(chat_id),
            step="yt-get-video-transcript",
            status="started",
            progress=0,
            message="Fetching video transcript…",
        )

        transcript_response: GetVideoTranscriptStepOutput = await step.run(
            step_id="yt-get-video-transcript",
            handler=lambda: get_video_transcript(
                inputs=GetVideoTranscriptStepInput(
                    video_id=str(yt_video_id), language_code=None
                )
            ),
        )

        await publish_workflow_status(
            chat_id=str(chat_id),
            step="yt-get-video-transcript",
            status="completed",
            progress=25,
            message="Transcript fetched successfully.",
        )

        # ── Step 2: Chunk transcript ───────────────────────────────────
        await publish_workflow_status(
            chat_id=str(chat_id),
            step="yt-chunk-video",
            status="started",
            progress=25,
            message="Chunking transcript…",
        )

        chunks: list[ChunkTranscriptStepOutputElement] = await step.run(
            step_id="yt-chunk-video",
            handler=lambda: chunk_transcript(
                inputs=ChunkTranscriptStepInput(
                    transcript_data=transcript_response, video_data=None
                )
            ),
        )

        await publish_workflow_status(
            chat_id=str(chat_id),
            step="yt-chunk-video",
            status="completed",
            progress=50,
            message=f"Transcript chunked into {len(chunks)} chunks.",
        )

        # ── Step 3: Store chunks in vector DB ──────────────────────────
        await publish_workflow_status(
            chat_id=str(chat_id),
            step="store-chunks-in-vdb",
            status="started",
            progress=50,
            message="Storing chunks in vector database…",
        )

        insert_response: StoreChunksInVDBStepOutput = await step.run(
            step_id="store-chunks-in-vdb",
            handler=lambda: store_chunks_in_vdb(
                inputs=StoreChunksInVDBStepInput(
                    chunks=chunks, yt_video_id=str(yt_video_id)
                )
            ),
        )
        total_chunks = len(insert_response)

        logger.info(f"[yt_video_id]: {yt_video_id}, [chunks]: {total_chunks}")

        await publish_workflow_status(
            chat_id=str(chat_id),
            step="store-chunks-in-vdb",
            status="completed",
            progress=75,
            message=f"Stored {total_chunks} chunks in vector database.",
        )

        # ── Step 4: Update video info ──────────────────────────────────
        await publish_workflow_status(
            chat_id=str(chat_id),
            step="update-video-info",
            status="started",
            progress=75,
            message="Updating video information…",
        )

        transcript_text = ""
        for chunk in chunks:
            transcript_text = transcript_text + " " + chunk["text"].strip()

        duration: int = chunks[-1]["end_ms"] // 1000

        output: UpdateVideoInfoStepOutput = await step.run(
            step_id="update-video-info",
            handler=lambda: update_video_info(
                inputs=UpdateVideoInfoStepInput(
                    yt_video_id=str(yt_video_id),
                    duration_secs=duration // 1000,
                    transcript=transcript_text,
                )
            ),
        )

        logger.info(
            f"[video_id]: {output["video_id"]}, [STATUS]: {output['processing_status']}"
        )

        await publish_workflow_status(
            chat_id=str(chat_id),
            step="update-video-info",
            status="completed",
            progress=100,
            message="Video processing complete.",
        )

    # except inngest.StepError as exc:
    #     if isinstance(exc.__cause__, SerpApiResponseError):
    #         # Raised when no transcript to fetch for the video
    #         await publish_workflow_status(
    #             chat_id=str(chat_id),
    #             step="workflow",
    #             status="failed",
    #             progress=-1,
    #             message=f"Transcript Not Available For This Video.",
    #         )
    #         raise inngest.NonRetriableError(
    #             message="Transcript Not Available For This Video."
    #         )

    except Exception as e:
        logger.error(f"Workflow failed for chat_id={chat_id}: {e}")
        logger.error(f"ERROR TYPE: {type(e)}, CAUSE: {e.__cause__}")
        await publish_workflow_status(
            chat_id=str(chat_id),
            step="workflow",
            status="failed",
            progress=-1,
            message=f"Workflow failed: {str(e)}",
        )
        raise

    return None
