import asyncio as aio
from src.lib.scraper.yt import YouTubeClient
from src.lib.scraper.exceptions import SerpApiError
from src.lib.chunking.time_based_chunking import TimeBasedChunking
from loguru import logger
from src.lib.weviate_db.client import WeaviateClient
from src.lib.weviate_db.service import WeaviateService
from src.lib.weviate_db.types import (
    YoutubeInfoCollectionObject,
    WeaviateQueryOptions,
    SearchTypeEnum,
)
from weaviate.classes.query import Filter

TEST_VIDEO_ID = "p8ngBrlr9nY"


async def main() -> None:
    client = YouTubeClient()
    wv_client: WeaviateClient | None = None

    try:
        import time

        print(f"Fetching video {TEST_VIDEO_ID}...")

        transcript = await client.get_transcript(
            TEST_VIDEO_ID,
            language_code="en",
        )

        s1 = TimeBasedChunking(
            window_seconds=120, overlap_seconds=15, min_chunk_seconds=0
        )

        start = time.time()
        chunks1 = await s1.chunk(transcript_data=transcript)
        ended = time.time() - start
        logger.info(f"Chunking Ended in : {ended} seconds.")

        for chunk in chunks1:
            logger.debug(
                {
                    "index": chunk.chunk_index,
                    "start": chunk.start_time_text,
                    "end": chunk.end_time_text,
                    "chapter": chunk.chapter,
                }
            )
        wv_client = await WeaviateClient.create()
        service = WeaviateService(wv_client)
        docs = [
            YoutubeInfoCollectionObject(
                chunk=chunk.text,
                chunk_start_sec=chunk.start_ms // 1000,
                chunk_end_sec=chunk.end_ms // 1000,
                video_id=TEST_VIDEO_ID,
            )
            for chunk in chunks1
        ]
        result = await service.insert_into_db(docs)
        logger.info(f"\n\n[Insert Result]: {result}")

        result = await service.retrieve(
            WeaviateQueryOptions(
                field="chunk",
                search_type=SearchTypeEnum.HYBRID,
                limit=10,
                value="What is the video about?",
                filters=Filter.by_property("video_id").equal(TEST_VIDEO_ID),
            )
        )
        logger.info(f"\n\n[Retrieve Result]: {result}")

    except SerpApiError as exc:
        print(f"SerpApi error: {exc}, [ERROR]: {exc.__class__}")

    finally:
        assert wv_client
        await wv_client.close()


if __name__ == "__main__":
    aio.run(main=main())
