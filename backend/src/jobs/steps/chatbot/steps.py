from src.lib.weviate_db.service import WeaviateService
from src.lib.weviate_db.types import WeaviateQueryOptions, YoutubeInfoCollectionObject
from typing import cast
from src.lib.weviate_db.client import WeaviateClient
from weaviate.classes.query import Filter
from src.utils import wrap_in_session
import inngest
from src.domains.chats.repository import MessagesRepository
from src.db.postgres.schemas import Messages

from .types import GetVideoContextFromVdbInput, GetVideoContextFromVdbOutput, CreateNewMessageRecordInput, CreateNewMessageRecordOutput


# Further things like application level ranking filter. Score filter.
# Will be done withing this funciton only, for now it is simple returning fixed number of
# objects inclding all properties
async def get_video_context_from_vdb(
    inputs: GetVideoContextFromVdbInput,
) -> GetVideoContextFromVdbOutput:
    weaviate_client = await WeaviateClient.create()
    weaviate_service = WeaviateService(weaviate_client)
    query = WeaviateQueryOptions(
        field=inputs["field"],
        value=inputs["query"],
        search_type=inputs["search_type"],
        limit=inputs["limit"],
        filters=Filter.by_property("video_id").equal(inputs["video_id"]),
    )
    try:
        result = await weaviate_service.retrieve(query_options=query)
        data = [cast(YoutubeInfoCollectionObject, obj.properties) for obj in result]

    except Exception as exc:
        raise inngest.NonRetriableError(message=f"Error occurred: {exc}")

    return GetVideoContextFromVdbOutput(data=data)



async def create_new_message_record(
    inputs: CreateNewMessageRecordInput,
) -> CreateNewMessageRecordOutput:
    repository = MessagesRepository()

    message: Messages | None = await wrap_in_session(
        repository.create_new_message_record,
        session=None,
        chat_id=inputs["chat_id"],
        role=inputs["role"],
        content=inputs["content"],
        tokens=inputs["tokens"],
        should_commit=inputs["should_commit"],
    )

    if message is None:
        raise inngest.NonRetriableError(
            message="Failed to create message record."
        )
    
    return CreateNewMessageRecordOutput(
        message_id=str(message.id),
        chat_id=str(message.chat_id),
        content=message.content,
        tokens=message.tokens,
        role=message.role,
        created_at=message.created_at
    )

    
