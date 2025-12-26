from typing import List, Dict, get_type_hints


def format_docs(retrieved_docs: List[Dict]):
    context_text = "\n\n".join(dict_data['fields']['chunk_text'] for dict_data in retrieved_docs)
    return context_text


def typed_dict_to_prompt(cls, description: str = "") -> str:
    """
    Convert a TypedDict with Annotated fields to a strict JSON-only prompt.
    """

    type_hints = get_type_hints(cls, include_extras=True)

    lines = []

    if description:
        lines.append(description.strip())

    lines.append(
        "You MUST output ONLY a valid JSON object.\n"
        "Do NOT include any text before or after the JSON.\n"
        "Do NOT include markdown, code fences, comments, or explanations.\n"
        "Do NOT acknowledge the request.\n"
        "The output MUST be directly parsable by json.loads.\n"
        "If you include anything other than raw JSON, the response is invalid.\n"
    )

    lines.append("The JSON object MUST contain exactly the following fields:")

    for field_name, annotated_type in type_hints.items():
        if hasattr(annotated_type, "__metadata__"):
            field_type = annotated_type.__origin__.__name__
            field_desc = "; ".join(str(m) for m in annotated_type.__metadata__)
        else:
            field_type = getattr(annotated_type, "__name__", str(annotated_type))
            field_desc = ""

        if field_desc:
            lines.append(f'- "{field_name}": {field_type} ({field_desc})')
        else:
            lines.append(f'- "{field_name}": {field_type}')

    lines.append(
        "\nRules:\n"
        "- All fields MUST be present.\n"
        "- Use null if a value is unknown.\n"
        "- Do NOT invent additional fields.\n"
        "- Output must be a single JSON object.\n"
        "- No trailing commas.\n"
    )

    lines.append("User query:\n{user_query}")

    return "\n".join(lines)
