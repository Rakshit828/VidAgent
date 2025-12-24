from typing import TypeAlias, Self


from src.ai.youtube.transcript_preprocessor import TranscriptPreprocessor, TranscriptChunk
from src.ai.youtube.video_loader import load_video_transcript, YoutubeApiResponse
from src.ai.pinecone_vector_db.youtube_chunks import PineconeClient, init_pinecone_db
from src.ai.utils import format_docs
from src.ai.youtube.transcript_preprocessor import TranscriptPreprocessor

ContextText: TypeAlias = str


class Components:
    def __init__(
        self, vector_db: PineconeClient, transcript_preprocessor: TranscriptPreprocessor
    ):
        self.vector_db = vector_db
        self.transcript_preprocessor = transcript_preprocessor
    
    @classmethod
    async def init(cls) -> Self:
        pinecone_client = await init_pinecone_db()
        transcript_preprocessor = TranscriptPreprocessor()
        return cls(pinecone_client, transcript_preprocessor)

    async def load_and_store_video(self, video_id: str, user_id: str):
        """Loads the video transcript and stores it in the vector database."""
        youtube_api_response: YoutubeApiResponse = await load_video_transcript(video_id=video_id)
        transcript_data_chunks: list[TranscriptChunk] = await self.transcript_preprocessor.group_transcript_into_chunks(
            transcript=youtube_api_response.transcript, video_id=video_id
        )
        video_records_data = {"user_id": user_id, "records": transcript_data_chunks}
        await self.vector_db.upsert_records_into_vdb(
            video_records_data=video_records_data
        )

    async def load_cleaned_relevant_context(
        self, query: str, video_id: str, user_id: str, k: int
    ) -> ContextText:
        """Loads the relevant context from the vector database."""
        retrieved_chunks = await self.vector_db.retrieve_context(
            query=query, user_id=user_id, video_id=video_id, k=k
        )
        context_text = format_docs(retrieved_docs=retrieved_chunks)
        return context_text


