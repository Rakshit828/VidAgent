from langchain_core.prompts import PromptTemplate
import enum


class Prompts(enum.Enum):
    NORMAL_CHAT_PROMPT = PromptTemplate(
        template="""
        You are given a YouTube video transcript as context.
        Answer the query using only the information from the context.
        If the context is insufficient, clearly say so.
        Respond clearly and naturally. **Respond in the same language as the query.**

        QUERY:
        {user_query}

        PREVIOUS CONVERSATION:
        {conversation_history}

        CONTEXT:
        {context}

    """,
        input_variables=["context", "user_query", "conversation_history"],
    )

    INITIAL_DECISION_PROMPT = PromptTemplate(
        template="""
        You are an intelligent decision-making system. The user is interacting with a chat-based video analysis application, where
        they can ask any type of question about a given video. Your task is to interpret the user’s query and respond according to the provided instructions.

        QUERY:
        {query}

        INSTRUCTION:
        {instruction}
        """,
        input_variables=["query", "instruction"],
    )

    VERIFY_CONVERSATION_HISTORY_PROMPT = PromptTemplate(
        template="""
        You are an intelligent decision-making system. The user is interacting with a chat-based video analysis application, where
        they can ask any type of question about a given video. Your task is to identify if the given conversation history is
        relevant to the user query.

        QUERY:
        {query}

        CONVERSATION_HISTORY:
        {conversation_history}

        OUTPUT_EXAMPLES:
        if the conversation history is relevant to the user query return:
            { "requires_refetching": False}
        else:
            { "requires_refetching": True}
        The output should be only in JSON format, no extra text. Just JSON.
""",
        input_variables=["query", "conversation_history"],
    )
