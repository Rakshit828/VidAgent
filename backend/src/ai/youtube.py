from youtube_transcript_api import (
    YouTubeTranscriptApi, 
    TranscriptsDisabled, 
    NoTranscriptFound,
    VideoUnavailable, 
)
from .exceptions import (
    EnglishTranscripNotFoundError,
    TranscriptNotAllowedError,
    VideoNotFoundError,
    UnexpectedErrorOccurredInTranscriptError
)

youtube_transcript_api = YouTubeTranscriptApi()


def load_video_transcript(video_data: dict[str, str]) -> str:
    """Return the transcript of the video in string format"""
    try:
        transcript = youtube_transcript_api.fetch(video_id=video_data['video_id'], languages=["en"])
            
        transcript_text_list = [f"+{transcript_snippet.start}" + transcript_snippet.text for transcript_snippet in transcript]
        transcript_text = " ".join(transcript_text_list)
        video_data.update({"transcript_text": transcript_text})
        
        return video_data
    
    except NoTranscriptFound:
        raise EnglishTranscripNotFoundError()
    
    except TranscriptsDisabled:
        raise TranscriptNotAllowedError()
    
    except VideoUnavailable:
        raise VideoNotFoundError()
    
    except Exception:
        raise UnexpectedErrorOccurredInTranscriptError()
