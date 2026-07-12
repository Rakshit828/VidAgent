from .client import WeaviateClient
from .types import YoutubeInfoCollectionObject, WeaviateQueryOptions, SearchTypeEnum
import weaviate.exceptions as exc
from weaviate.classes.query import FilterReturn
from typing import List
from loguru import logger


class WeaviateService:
    def __init__(self, wv_client: WeaviateClient) -> None:
        self._wv_client: WeaviateClient = wv_client

    async def insert_into_db(self, documents: List[YoutubeInfoCollectionObject]):
        yt_info_collection = self._wv_client.collection()
        try:
            result = await yt_info_collection.data.insert_many(objects=documents)  # type: ignore
        except exc.WeaviateInsertInvalidPropertyError as e:
            raise e
        except exc.WeaviateInsertManyAllFailedError as e:
            raise e

        return result.uuids

    async def retrieve(self, query_options: WeaviateQueryOptions):
        yt_info_collection = self._wv_client.collection()

        if query_options.search_type == SearchTypeEnum.HYBRID:
            response = await yt_info_collection.query.hybrid(
                query=query_options.value,
                alpha=0.7,
                query_properties=[query_options.field],
                filters=query_options.filters,
                limit=query_options.limit,
            )
        if query_options.search_type == SearchTypeEnum.BM25:
            response = await yt_info_collection.query.bm25(
                query=query_options.value,
                query_properties=[query_options.field],
                filters=query_options.filters,
                limit=query_options.limit,
            )
        else:
            # THis is pure semantic search
            response = await yt_info_collection.query.near_text(
                query=query_options.value,
                filters=query_options.filters,
                target_vector="chunk",
                limit=query_options.limit,
            )

        return response.objects

    async def delete_records(self, filters: FilterReturn):
        yt_info_collection = self._wv_client.collection()
        try:
            await yt_info_collection.data.delete_many(where=filters)
        except Exception as e:
            raise e

        return
