from typing import List, Dict, get_type_hints


def format_docs(retrieved_docs: List[Dict]):
    context_text = "\n\n".join(dict_data['fields']['chunk_text'] for dict_data in retrieved_docs)
    return context_text


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
    lines.append("Return a JSON object with the following fields based on the given query:")

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
