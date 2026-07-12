from typing import TypedDict
from src.lib.weviate_db.types import SearchTypeEnum, YoutubeInfoCollectionObject


class GetVideoContextFromVdbInput(TypedDict):
    video_id: str
    field: str
    search_type: SearchTypeEnum
    query: str
    limit: int


class GetVideoContextFromVdbOutput(TypedDict):
    data: list[YoutubeInfoCollectionObject]
