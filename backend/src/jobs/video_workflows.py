import inngest

from src.services.inngest_client import inngest_client

from .config import InngestEventsEnum
from src.jobs.steps.video_processing.steps import (
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
from src.db.postgres.schemas import VideoProcessingStatusEnum
from src.jobs.utils import SPLITTER


@inngest_client.create_function(
    fn_id="chat-created-workflow",
    trigger=inngest.TriggerEvent(event=InngestEventsEnum.CHAT_CREATED),
    idempotency="event.data.video_id",
)
async def process_video_workflow(ctx: inngest.Context) -> None:
    logger = ctx.logger
    logger.info("Event is : %s", ctx.event)
    step = ctx.step

    video_id = ctx.event.data["video_id"]
    chat_id = ctx.event.data["chat_id"]
    yt_video_id = ctx.event.data["yt_video_id"]

    logger.info(
        "[Video_id]: %s, [Chat_id]: %s, [yt_video_id]: %s",
        video_id,
        chat_id,
        yt_video_id,
    )

    try:

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

        logger.info(
            "Transcript successfully fetched. [CHUNKS]: %d",
            len(transcript_response.get("transcript", [])),
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
        logger.info("Transcript chunked.")

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

        logger.info(
            "Stored in VDB: [yt_video_id]: %s, [chunks]: %d", yt_video_id, total_chunks
        )

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
                    status=VideoProcessingStatusEnum.COMPLETED,
                )
            ),
        )

        logger.info("Updated video info in db: %s", output)

        await publish_workflow_status(
            chat_id=str(chat_id),
            step="update-video-info",
            status="completed",
            progress=100,
            message="Video processing complete.",
        )

    except inngest.NonRetriableError as e:
        logger.error("StepError occurred. Details are : %s", e.message)
        message: str = e.message

        message_dict: dict[str, str] = {}
        key_values = message.split(SPLITTER)
        for key_val in key_values:
            unit = key_val.split("=")
            message_dict[unit[0]] = unit[1]

        logger.error("Error occurred: %s", message_dict)

        await publish_workflow_status(
            chat_id=str(chat_id),
            step=message_dict.get("step", "not defined"),
            status="failed",
            progress=-1,
            message=message_dict.get("message", "not defined"),
        )

        output: UpdateVideoInfoStepOutput = await step.run(
            step_id="update-video-as-unprocessable",
            handler=lambda: update_video_info(
                inputs=UpdateVideoInfoStepInput(
                    yt_video_id=str(yt_video_id),
                    status=VideoProcessingStatusEnum.UNPROCESSABLE,
                    duration_secs=None,
                    transcript=None,
                )
            ),
        )

    except Exception as e:
        logger.error(
            "UnexpedtedError occurred. Details are : [ERROR]: %s, [MSG]: %s",
            e.__class__.__name__,
            str(e),
        )
        await publish_workflow_status(
            chat_id=str(chat_id),
            step="not defined",
            status="failed",
            progress=-1,
            message="",
        )

    return None
