from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, TranscriptsDisabled, VideoUnavailable
from youtube_transcript_api import (
    TranscriptList,
    FetchedTranscript,
     NotTranslatable
)


def get_transcript_text(transcript: FetchedTranscript):
    transcript_text_list = [transcript_snippet.text for transcript_snippet in transcript]
    transcript_text = " ".join(transcript_text_list)
    return transcript_text


youtube_transcript_api = YouTubeTranscriptApi()

VIDEO_ID = "xdA0pGDiUPE"

def load_video_transcript(video_id: str) -> str:
    """Return the transcript of the video in string format"""
    try:
        transcript = youtube_transcript_api.fetch(video_id=video_id, languages=["en"])
        return transcript
    
    except NoTranscriptFound:
        """Raised if the transcript is not found in English"""
        languages = youtube_transcript_api.list(video_id)
        print("Languages are", languages)

        manually_generated = languages._manually_created_transcripts
        auto_generated = languages._generated_transcripts

        manually_generated.update(auto_generated)
        available_languages = manually_generated

        print("AVAILABLE LANGUAGES", available_languages)

        for lang_code, transcript_obj in available_languages.items():
            try:
                translated_obj = transcript_obj.translate('en')
                print(translated_obj)
                fetched_transcript_obj = translated_obj.fetch()
                return fetched_transcript_obj
            
            except NotTranslatable:
                print("Language is not translatable")

            except Exception as e:
                print("Error during the translation of the language", e)
                return
            

    except TranscriptsDisabled:
        """Raised if the video disabled captions"""
        print("The video disables the subtitiles")
    except VideoUnavailable:
        languages = youtube_transcript_api.list(VIDEO_ID)
        print(languages)  
    except Exception:
        languages = youtube_transcript_api.list(VIDEO_ID)
        print(languages)


fetched_transcript = load_video_transcript(video_id="GWnSsjT4V68")

if fetched_transcript is None:
    print("No transcript available for this video")
else:
    print(get_transcript_text(fetched_transcript))



def find_transcript_exists(video_id: str):
    video_id = "18yFj0z_UwY"
    transcript_list = youtube_transcript_api.list(video_id=video_id)
    print(transcript_list)
    try:
        transcript = transcript_list.find_transcript(language_codes=['en'])
    except NoTranscriptFound:
        print("Video transcript not found in english")


