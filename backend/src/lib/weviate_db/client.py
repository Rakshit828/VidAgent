import asyncio
import weaviate as wv
import weaviate.collections as wvc
from weaviate.classes.init import Auth
from weaviate.classes.config import Property, DataType, Configure, Tokenization
from loguru import logger
from src.config import CONFIG

import tracemalloc

tracemalloc.start()


class WeaviateClient:
    _obj: "WeaviateClient | None" = None
    _lock = asyncio.Lock()

    def __init__(
        self, weaviate: wv.WeaviateAsyncClient, collection: wvc.CollectionAsync
    ) -> None:
        self._async_weaviate: wv.WeaviateAsyncClient = weaviate
        self._collection: wvc.CollectionAsync = collection

    @classmethod
    async def create(cls) -> "WeaviateClient":
        if cls._obj is not None:
            return cls._obj

        async with cls._lock:

            if cls._obj is not None:
                return cls._obj

            async_weaviate = wv.use_async_with_weaviate_cloud(
                cluster_url=CONFIG.WEAVIATE_URL,
                auth_credentials=Auth.api_key(CONFIG.WEAVIATE_API_KEY),
            )
            await async_weaviate.connect()
            if not await async_weaviate.collections.exists(
                CONFIG.WEAVIATE_COLLECTION_NAME
            ):
                collection: wvc.CollectionAsync = (
                    await async_weaviate.collections.create(
                        CONFIG.WEAVIATE_COLLECTION_NAME,
                        vector_config=[Configure.Vectors.text2vec_weaviate(
                            name="chunk", source_properties=["chunk"]
                        )], 
                        properties=[
                            Property(
                                name="chunk",  # Both vectorized and BM25
                                data_type=DataType.TEXT,
                                tokenization=Tokenization.WORD,
                            ),
                            Property(  # Filter only
                                name="video_id",
                                data_type=DataType.TEXT,
                                skip_vectorization=True,
                                index_searchable=False,
                            ),
                            Property(
                                name="chunk_start_sec", data_type=DataType.INT
                            ),  # Filter only
                            Property(
                                name="chunk_end_sec", data_type=DataType.INT
                            ),  # Filter only
                        ],
                    )
                )
            else:
                collection: wvc.CollectionAsync = async_weaviate.collections.get(
                    CONFIG.WEAVIATE_COLLECTION_NAME
                )

        cls._obj = cls(async_weaviate, collection)
        return cls._obj

    async def close(self):
        logger.info(f"Closing the weaviate client.")
        await self._async_weaviate.close()
        self._obj = None
        return None

    def collection(self) -> wvc.CollectionAsync:
        return self._collection
