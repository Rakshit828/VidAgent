from typing import TypedDict, Annotated, Optional, List, Dict
from dotenv import load_dotenv
import json
from pydantic import BaseModel, Field,  ConfigDict
from langgraph.config import RunnableConfig
from langgraph.runtime import Runtime
from langgraph.graph import StateGraph, START, END
from enum import Enum
from loguru import logger

from .prompts import Prompts
from .chat_models import ChatModels
from .utils import typed_dict_to_prompt
from .components import Components



load_dotenv()


class Nodes(Enum):
    LLM_INITIAL_DECISION_MAKER = "llm_initial_decision_maker"
    FETCH_RELEVANT_CONTEXT = "fetch_relevant_context"
    VERIFY_CONVERSATION_HISTORY = "verify_conversation_history"
    FETCH_CONVERSATION_HISTORY = "fetch_conversation_history"
    FINAL_LLM_RESPONSE = "final_llm_response"


class AgentContext(BaseModel):
    chat_model: ChatModels = Field(default=ChatModels())
    components: Components

    # To be passed during every run
    user_id: str
    video_id: str
    chat_id: str

    model_config = ConfigDict(arbitrary_types_allowed=True)


class DecisionState(TypedDict):
    requires_previous_conversations: Annotated[
        bool, "Indicates if the current query depends on previous dialogue context."
    ]

    # Video segment targeting information
    start_time: Annotated[
        Optional[int],
        "Start time (in minutes) of the target video segment, if specified.",
    ]
    end_time: Annotated[
        Optional[int],
        "End time (in minutes) of the target video segment, if specified.",
    ]
    user_query: Annotated[str, "Raw text of the user’s latest message or instruction."]


class AgentState(DecisionState):
    relevant_context: List[Dict]
    conversation_history: List[str]
    requires_refetching: bool
    next_node: Optional[str] = None
    response: str


async def llm_initial_decision_maker(
    state: AgentState, runtime: Runtime[AgentContext], config: RunnableConfig
) -> dict:
    """Returns the updated decision state directly from llm."""
    chat_model = runtime.context.chat_model
    user_query = state["user_query"]
    instruction = typed_dict_to_prompt(DecisionState)
    prompt = Prompts.INITIAL_DECISION_PROMPT.value.format(
        query=user_query, instruction=instruction
    )
    decision_dict = await chat_model.call_llm(prompt, is_json=True)

    if decision_dict.get("requires_previous_conversations"):
        decision_dict.update({'next_node': 'retrieve_conversation'})
    else:
        decision_dict.update({'next_node': 'retrieve_context'})
    
    # logger.info(f"[LLM INITIAL DECISION MAKER] {decision_dict}")

    return decision_dict


async def route_to_context_or_conversation(state: AgentState) -> str:
    requires_previous_conversations = state["requires_previous_conversations"]
    if requires_previous_conversations:
        return "retrieve_conversation"
    else:
        return  "retrieve_context"


async def fetch_conversation_history(
    state: AgentState, runtime: Runtime[AgentContext]
) -> dict:
    context = runtime.context
    conversation_history = []
    return {"conversation_history": conversation_history, 'next_node': 'retrieve_context'}
    # Since this contains the memory part, this will be done later


async def fetch_relevant_context(
    state: AgentState, runtime: Runtime[AgentContext]
) -> dict:
    context: AgentContext = runtime.context
    user_query = state["user_query"]
    pinecone_client = context.components.vector_db
    relevant_context: List[Dict] = await pinecone_client.retrieve_context(
        query=user_query, user_id=context.user_id, video_id=context.video_id, k=4
    )
    formatted_context = [{ "start_time": context['fields']['start_time'], "end_time": context['fields']['end_time'], "text": context['fields']['text'] } for context in relevant_context]
    # The value of k can be modified based on the user specific instruction
    # logger.info(f"[FETCH RELEVANT CONTEXT] {formatted_context}")
    return {"relevant_context": formatted_context, 'next_node': 'final_llm_response'}




async def final_llm_response(state: AgentState, runtime: Runtime[AgentContext]):
    context = runtime.context
    user_query = state["user_query"]
    conversation_history = state["conversation_history"]
    video_context = state["relevant_context"]

    prompt = Prompts.NORMAL_CHAT_PROMPT.value.format(
        conversation_history=conversation_history,
        context=video_context,
        user_query=user_query,
    )
    answer = await context.chat_model.call_llm(prompt)
    # logger.info(f"[FINAL LLM RESPONSE] {answer}")
    return {"response": answer, 'next_node': '__end__'}


graph = StateGraph(state_schema=AgentState, context_schema=AgentContext)


graph.add_node(Nodes.LLM_INITIAL_DECISION_MAKER.value, llm_initial_decision_maker)
graph.add_node(Nodes.FETCH_RELEVANT_CONTEXT.value, fetch_relevant_context)
graph.add_node(Nodes.FETCH_CONVERSATION_HISTORY.value, fetch_conversation_history)
graph.add_node(Nodes.FINAL_LLM_RESPONSE.value, final_llm_response)


graph.add_edge(START, Nodes.LLM_INITIAL_DECISION_MAKER.value)
graph.add_conditional_edges(
    Nodes.LLM_INITIAL_DECISION_MAKER.value,
    route_to_context_or_conversation,
    {
        "retrieve_conversation": Nodes.FETCH_CONVERSATION_HISTORY.value,
        "retrieve_context": Nodes.FETCH_RELEVANT_CONTEXT.value,
    },
)
graph.add_edge(
    Nodes.FETCH_CONVERSATION_HISTORY.value, Nodes.FETCH_RELEVANT_CONTEXT.value
)
graph.add_edge(Nodes.FETCH_RELEVANT_CONTEXT.value, Nodes.FINAL_LLM_RESPONSE.value)
graph.add_edge(Nodes.FINAL_LLM_RESPONSE.value, END)



class Agent:
    def __init__(self):
        global graph
        self.agent = graph.compile()
        logger.info('Graph has been compiled')

    def sse_event(self, event_type: str, data: dict):
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"

    async def run_agent(
        self, input_state: AgentState, context: AgentContext
    ):
        async for mode, chunk in self.agent.astream(
            input=input_state, context=context, stream_mode=['messages', 'updates']
        ):
            if mode == 'updates':
                next_node = f'{list(chunk.values())[0].get("next_node")}'.strip()
                yield self.sse_event('agent_step', {
                    "name": next_node
                })
            elif mode == 'messages':
                if chunk[1].get('langgraph_node') == Nodes.FINAL_LLM_RESPONSE.value:
                    token = f'{chunk[0].content}'
                    yield self.sse_event("token", {
                        "text": token
                    })
                    