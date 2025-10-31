from typing import TypedDict, Annotated
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import json
from typing import get_type_hints, Annotated, TypedDict

from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()

def typed_dict_to_prompt(cls, description: str = "") -> str:
    """
    Convert a TypedDict with Annotated fields to a descriptive prompt.

    Args:
        cls: The TypedDict class
        description: Optional general description for the prompt

    Returns:
        A string prompt describing expected JSON output.
    """
    type_hints = get_type_hints(cls, include_extras=True)
    lines = [description.strip()] if description else []
    lines.append("Return a JSON object with the following fields:")

    for field_name, annotated_type in type_hints.items():
        # Extract type and annotation
        if hasattr(annotated_type, "__metadata__"):
            field_type = annotated_type.__origin__.__name__
            field_desc = "; ".join(str(m) for m in annotated_type.__metadata__)
        else:
            field_type = getattr(annotated_type, "__name__", str(annotated_type))
            field_desc = ""
        lines.append(f"- {field_name} ({field_type}): {field_desc}")

    lines.append("Output must be valid JSON, include all fields, and do not add extra text. \n\n User Query: {user_query}")
    return "\n".join(lines)


class DecisionState(TypedDict):
    """Structured output defining decision parameters."""
    require_previous_conversations: Annotated[
        bool, "Defines whether the query depends on previous conversations."
    ]
    is_quiz: Annotated[
        bool, "Determines if the user wants a quiz from the YouTube transcript."
    ]
    start_time: Annotated[float, "Start time (in minutes) from the video."]
    end_time: Annotated[float, "End time (in minutes) from the video."]
    duration: Annotated[float, "The duration between start and end time."]



decision_instruction_prompt = typed_dict_to_prompt(
    DecisionState,
    description=(
        "You are an expert decision extractor. Think very precisely and logically"
        "Analyze the user query about a YouTube video (100 minutes long) and generate decisions"
        "that will guide how the answer should be provided. "
    )
)

class Components:
    def __init__(self, ai_model_name: str, temperature: float | int, vector_db):
        self.llm1 = ChatGroq(model=ai_model_name, temperature=temperature)
        self.llm2 = ChatGroq(model="openai/gpt-oss-20b", temperature=temperature)
        self.llm_with_fallbacks = self.llm1.with_fallbacks([self.llm2])
        self.vector_db = vector_db


ai_components: Components = Components(
    "llama-3.1-8b-instant", temperature=0.7, vector_db=None
)


def get_relevant_decisions(user_query: str) -> DecisionState:
    """Manually prompt the LLM to output JSON with required fields."""
    if ai_components is None:
        raise ValueError("ai_components is not initialized.")

    # ✅ Fix: use .format() to render the template correctly
    prompt_text = decision_instruction_prompt.format(user_query=user_query)
    print(prompt_text)
    raw_response = ai_components.llm1.invoke(prompt_text)

    # Extract text safely
    text = (
        raw_response.content if hasattr(raw_response, "content") else str(raw_response)
    )

    # Parse or fallback
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {
            "require_previous_conversations": False,
            "is_quiz": False,
            "start_time": 0,
            "end_time": 0,
        }

    return parsed



response = get_relevant_decisions("Summarize the mid-section of the video")
print(response)




graph = StateGraph()