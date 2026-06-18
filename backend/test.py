import asyncio as aio
from src.lib.scraper.yt import YouTubeClient
from src.lib.scraper.exceptions import SerpApiError

# Rick Astley - Never Gonna Give You Up
TEST_VIDEO_ID = "RV03dkFdhlo"


async def main() -> None:
    client = YouTubeClient()

    try:
        print(f"Fetching video {TEST_VIDEO_ID}...")

        # video = await client.get_video(TEST_VIDEO_ID)
        # print(f"/n{video.__class__}: {video}")

        transcript = await client.get_transcript(
            TEST_VIDEO_ID,
            language_code="en",
        )
        print(f"/n{transcript.__class__}: {transcript}")

    except SerpApiError as exc:
        print(f"SerpApi error: {exc}, [ERROR]: {exc.__class__}")

    finally:
        await client.close()


if __name__ == "__main__":
    aio.run(main=main())
