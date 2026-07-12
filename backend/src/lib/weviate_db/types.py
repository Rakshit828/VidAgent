from typing import TypedDict, TypeVar, List, Self
from pydantic import BaseModel, model_validator
from weaviate.classes.config import DataType
from weaviate.classes.query import FilterReturn
from enum import Enum

T = TypeVar("T")


class SearchTypeEnum(str, Enum):
    SEMANTIC = "semantic"
    BM25 = "bm25"
    HYBRID = "hybrid"


class YoutubeInfoCollectionPropertyElement(TypedDict):
    field: str
    type: DataType
    search_type: SearchTypeEnum | None


class YoutubeInfoCollectionSchema(TypedDict):
    properties: List[YoutubeInfoCollectionPropertyElement]


YOUTUBE_INFO_COLLECTION_SCHEMA: YoutubeInfoCollectionSchema = {
    "properties": [
        {
            "field": "chunk",
            "type": DataType.TEXT,
            "search_type": SearchTypeEnum.HYBRID,
        },
        {
            "field": "video_id",
            "type": DataType.INT,
            "search_type": None,
        },
        {
            "field": "chunk_start_sec",
            "type": DataType.INT,
            "search_type": None,
        },
        {
            "field": "chunk_end_sec",
            "type": DataType.INT,
            "search_type": None,
        },
    ]
}


class YoutubeInfoCollectionObject(TypedDict):
    chunk: str
    video_id: str
    chunk_start_sec: int
    chunk_end_sec: int



class WeaviateQueryOptions(BaseModel):
    field: str
    search_type: SearchTypeEnum
    value: str
    filters: FilterReturn
    limit: int 

    model_config = {
        "arbitrary_types_allowed": True
    }
    

    @model_validator(mode="after")
    def validation(self) -> Self:
        search_type = [
            prop["search_type"]
            for prop in YOUTUBE_INFO_COLLECTION_SCHEMA["properties"]
            if prop["field"] == self.field and prop["search_type"] is not None
        ]
        search_type = search_type[0]
        if self.search_type != SearchTypeEnum.HYBRID and self.search_type != search_type:
            raise Exception(
                f"{self.search_type} not allowed for field {self.field} with search type: {search_type}"
            )
        return self
