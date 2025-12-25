from typing import List
import httpx
from fastapi import HTTPException
from loguru import logger
from ..exceptions import UnexpectedErrorOccurredInTranscriptError
from src.config import CONFIG
from pydantic import BaseModel

HEADERS = {
    "X-RapidAPI-Key": CONFIG.RAPID_API_KEY,
    "X-RapidAPI-Host": CONFIG.RAPID_API_HOST
}

class TranscriptResponse(BaseModel):
    text: str
    duration: float
    offset: float
    lang: str

class YoutubeApiResponse(BaseModel):
    success: bool
    transcript: List[TranscriptResponse]



async def load_video_transcript(video_id: str) -> YoutubeApiResponse:
    url = f"https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId={video_id}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url=url, headers=HEADERS)
            response.raise_for_status()
            api_data = response.json()

            if api_data.get("success"):
                logger.info("Youtube Transcript Has been fetched successfully")
                youtube_api_response = YoutubeApiResponse(**api_data)
                return youtube_api_response
            else:
                logger.info("Error Occurred during Video Load")
                logger.info(f"The api_data is {api_data}")
                raise UnexpectedErrorOccurredInTranscriptError()

    # ---- Network-level errors ----
    except httpx.ConnectError as e:
        print("Connection error")
        raise HTTPException(status_code=503, detail=f"Connection failed: {e}")
    except httpx.ConnectTimeout as e:
        print("Connection timeout")
        raise HTTPException(status_code=504, detail=f"Connection timed out: {e}")
    except httpx.ReadTimeout as e:
        print("Read Timeout")
        raise HTTPException(status_code=504, detail=f"Read timed out: {e}")
    except httpx.NetworkError as e:
        print("Network error")
        raise HTTPException(status_code=502, detail=f"Network error: {e}")
    except httpx.ProxyError as e:
        print("Proxy error")
        raise HTTPException(status_code=502, detail=f"Proxy error: {e}")
    except httpx.SSLError as e:
        print("SSL Error")
        raise HTTPException(status_code=495, detail=f"SSL error: {e}")

    # ---- Request cancelled or other client-side issue ----
    except httpx.RequestError as e:
        print("SOme backend issue")
        raise HTTPException(status_code=400, detail=f"Request error: {e}")

    # ---- Server responded with error status ----
    except httpx.HTTPStatusError as e:
        print("Server error by rapidapi")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"External API returned {e.response.status_code}: {e.response.text}",
        )

    # ---- Catch-all for unexpected internal issues ----
    except Exception as e:
        print("I dont know")
        raise HTTPException(status_code=500, detail=f"Unexpected server error: {e}")

