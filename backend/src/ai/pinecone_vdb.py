from pinecone import PineconeAsyncio
from src.utils.utils import get_video_id
from .exceptions import VectorDatabaseError
from pinecone.db_data.index_asyncio import _IndexAsyncio
from pinecone.exceptions.exceptions import PineconeApiException
from dotenv import load_dotenv
import os

load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_HOST = os.getenv("PINECONE_HOST")

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
                embed={"model": "llama-text-embed-v2", "field_map": {"text": "chunk_text"}},
            )
        index = client.IndexAsyncio(host=host)
        return cls(index)



    async def upsert_records_into_vdb(self, video_data: dict):
        namespace = video_data["user_id"]
        records = video_data["splitted_transcript"]
        try:
            from itertools import islice

            def chunks(iterable, size=96):
                """This function helps to divide the list into given size or less"""
                iterator = iter(iterable)
                for first in iterator:
                    yield [first] + list(islice(iterator, size - 1))

            for batch in chunks(records, 96):
                print(f"Length of batch: {len(batch)}")
                await self.index.upsert_records(namespace=namespace, records=batch)
                
        except Exception as e:
            if int(e.status) == 409:
                raise VectorDatabaseError(
                    status_code=409, 
                    message="You have reached the limit. Try after few minutes"
                )
            elif int(e.status) == 400:
                raise VectorDatabaseError(
                    status_code=400, 
                    message="Video is Too Long"
                )
            print(e)
            raise VectorDatabaseError()
        return True


    async def retrieve_context(self, query_data: dict):
        user_id = query_data["user_id"]
        video_id = query_data["video_id"]
        query = query_data["query"]
        k = query_data.get("k", 4)

        try:
            filtered_results = await self.index.search(
                namespace=user_id,
                query={
                    "inputs": {"text": query}, 
                    "top_k": k, 
                    "filter": {"video_id": video_id}
                },
                fields=["chunk_text"],
            )
        except PineconeApiException as e:
            print(e)
            raise VectorDatabaseError()
        
        results = filtered_results['result']['hits']
        return results



    async def delete_video_transcript(self, user_id, video_url_or_id):
        video_id = get_video_id(video_url_or_id)
        try:
            await self.index.delete(namespace=user_id, filter={"video_id": {"$eq": video_id}})
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
                    "filter": {"video_id": video_id}
                }
            )
        except Exception as e:
            print(e)
            raise VectorDatabaseError()
        
        print(f"\n\nType of result {type(results)}\n\n")
        exists = len(results['result']['hits']) != 0
        print(f"{results['result']['hits']}")
        return exists



# async factory
async def init_pinecone_db():
    return await PineconeClient.create(
        index_name="chattube-ai-vdb",
        api_key=PINECONE_API_KEY,
        host=PINECONE_HOST,
    )
