from langchain_groq import ChatGroq
import json
from typing import Dict, Any


class ChatModels:
    AVAILABLE_MODELS = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "meta-llama/llama-4-scout-17b-16e-instruct",
    ]

    def __init__(self):
        self.llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0)

    async def use_model(
        self, model_name: str = AVAILABLE_MODELS[0], temperature: float = 0
    ):
        """Returns the ChatGroq instance with the specified model and temperature."""
        if model_name.strip().lower() in self.AVAILABLE_MODELS:
            self.llm.model = model_name
            self.llm.temperature = temperature
            return self.llm
        return self.llm
    

    async def call_llm(self, prompt, is_json: bool = False) -> str | Dict[str, Any]:
        """A simple function that takes a prompt and calls a llm based on that prompt."""
        response = await self.llm.ainvoke(prompt)
        if is_json:
            return json.loads(response.content)
        return response.content

