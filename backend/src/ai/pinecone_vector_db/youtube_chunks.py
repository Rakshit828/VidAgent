from pinecone import PineconeAsyncio
from pinecone.db_data.index_asyncio import _IndexAsyncio
from pinecone.exceptions.exceptions import PineconeApiException
from dotenv import load_dotenv
import os
from typing import List, TypedDict, Dict, Generator

from src.utils import get_video_id
from src.ai.exceptions import VectorDatabaseError
from src.ai.youtube.transcript_preprocessor import TranscriptChunk
from loguru import logger

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_HOST = os.getenv("PINECONE_HOST")

class VideoRecords(TypedDict):
    user_id: str
    records: List[TranscriptChunk]


class PineconeClient:
    def __init__(self, index):
        self.index: _IndexAsyncio = index

    @classmethod
    async def create(cls, index_name: str, api_key: str, host: str):
        client = PineconeAsyncio(api_key=api_key)
        if not await client.has_index(index_name):
            await client.create_index_for_model(
                name=index_name,
                cloud="aws",
                region="us-east-1",
                embed={
                    "model": "llama-text-embed-v2",
                    "field_map": {"text": "chunk_text", "dimension": 2048},
                },
            )
        index = client.IndexAsyncio(host=host)
        return cls(index)

    async def upsert_records_into_vdb(self, video_records_data: VideoRecords):
        namespace: str = video_records_data["user_id"]
        records_with_chunks: list[TranscriptChunk] = video_records_data["records"]

        # To  convert pydantic class to dict, since pinecone uses .get() on records internally
        records_dict: list[dict] = map(lambda x: x.model_dump(), records_with_chunks)
        try:
            from itertools import islice

            def chunks(iterable: list[Dict], size=96) -> Generator[list[Dict], None, None]:
                """This function helps to divide the list into given size or less"""
                iterator = iter(iterable)
                for first in iterator:
                    yield [first] + list(islice(iterator, size - 1))

            for batch in chunks(records_dict, 96):
                logger.debug(f"The batch is : {batch} \n\n")
                await self.index.upsert_records(namespace=namespace, records=batch)

        except Exception as e:
                logger.exception(f"Error during upsert : {e}")
                raise VectorDatabaseError(
                    status_code=409,
                    message="Error during upsert, may be rate limit issue",
                )
    
        return True


    async def retrieve_context(
        self, query: str, user_id: str, video_id: str, k: int = 1
    ) -> List[Dict]:
        """
        Retrieves relevant context from the video based on the user query.

        Args:
            query (str): The user query about the video.
            user_id (str): The user id to search in specific namespace in pinecone
            video_id (str): The video which the user is querying, required for metadata filtering
            k(int): The number of chunks to retrieve

        Returns:
            List[Dict]: List of the dictionary with each chunk
        """
        try:
            filtered_results = await self.index.search(
                namespace=user_id,
                query={
                    "inputs": {"text": query},
                    "top_k": k,
                    "filter": {"video_id": video_id},
                },
                fields=["text", "start_time", "end_time"],
            )
        except PineconeApiException as e:
            print(e)
            raise VectorDatabaseError()

        results = filtered_results["result"]["hits"]
        return results


    async def delete_video_transcript(self, user_id, video_url_or_id):
        video_id = get_video_id(video_url_or_id)
        try:
            await self.index.delete(
                namespace=user_id, filter={"video_id": {"$eq": video_id}}
            )
        except Exception as e:
            print(e)
            raise VectorDatabaseError()
        return True

    async def check_for_transcript(self, user_id, video_url_or_id):
        video_id = get_video_id(video_url_or_id)
        try:
            results = await self.index.search(
                namespace=user_id,
                query={
                    "inputs": {"text": "What is the video about"},
                    "top_k": 1,
                    "filter": {"video_id": video_id},
                },
            )
        except Exception as e:
            print(e)
            print("THis is the vector database error")
            raise VectorDatabaseError()

        print(f"\n\nType of result {type(results)}\n\n")
        exists = len(results["result"]["hits"]) != 0
        print(f"{results['result']['hits']}")
        return exists


# async factory
async def init_pinecone_db():
    return await PineconeClient.create(
        index_name="chattube-ai-vdb",
        api_key=PINECONE_API_KEY,
        host=PINECONE_HOST,
    )
