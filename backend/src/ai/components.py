from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda, RunnableSequence
from langchain_core.prompts import PromptTemplate

from typing import List, Dict
import re
import uuid

from .youtube import load_video_transcript
from .utils import format_docs
from .pinecone_vdb import PineconeClient




class Chunker:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200,
            chunk_overlap=200,
            separators=[r"\+?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?"],
            is_separator_regex=True
        )


    async def split_transcript_into_texts(self, video_data: dict[str, str]):
        # The video data has keys : user_id, video_id, transcript_text
        transcript_text = video_data.get("transcript_text")
        video_id = video_data.get("video_id", 0)

        splitted_transcript = self.splitter.split_text(text=transcript_text)
        
        del video_data['transcript_text']

        cleaned_transcript = await self.preprocess_and_clean(splitted_transcript, video_id)

        video_data.update({"splitted_transcript": cleaned_transcript})

        return video_data  # (keys: user_id, video_id, splitted_transcript)
    


    async def preprocess_and_clean(self, splitted_transcript: List[str], video_id: str) -> List[Dict]:
        processed_transcript = []
        for i, chunk in enumerate(splitted_transcript):
            start_time_list = list(map(float, re.findall(r"\+?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?", string=chunk)))
            cleaned_chunk = " ".join(re.split(r"\+?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?", string=chunk))
            start_time = int(round(start_time_list[0] / 60))
            end_time = int(round(start_time_list[-1] / 60))
            cleaned_chunk = cleaned_chunk + f"\nThis chunk duration is {start_time} minutes to {end_time} minutes"
            
            print(f"\n\n Cleaned Chunk {i}: \n {cleaned_chunk}")
            cleaned_chunk_data = {
                "_id": str(uuid.uuid4()),
                "chunk_text": cleaned_chunk,
                "start_time": start_time,
                "end_time": end_time,
                "video_id": video_id
            }
            processed_transcript.append(cleaned_chunk_data)
        return processed_transcript


class PromptPicker:
    PROMPT = PromptTemplate(
        template="""
            You are given the context from a YouTube video transcript. 
            Answer the query using **only** the information provided in the context. 
            Do not include any information that is not present in the context. If the context
            is not enough acknowledge it.
            Answer as clearly and naturally as possible, using the context only.

            \n \n 
            CONTEXT:
            {context}
            \n\n
            QUERY:
            {user_query}

        """,
        input_variables=['context', 'user_query']
    )


class Components:
    def __init__(self, 
        ai_model_name,
        temperature,
    ):
        print("Loading AI components")

        self.llm = ChatGroq(model=ai_model_name, temperature=temperature)

        self.vector_db: PineconeClient = None

        self.chunker = Chunker()
          
        self.prompts = PromptPicker()

        self.parser = StrOutputParser()

        self.chains = None

        print("Loaded all AI components")


    async def get_response_llm(self, prompt):
        response = self.llm.astream(prompt)
        async for chunk in response:
            yield chunk.content


    async def build_chains(self):
        load_store_chain = RunnableSequence(
            RunnableLambda(load_video_transcript),
            RunnableLambda(self.chunker.split_transcript_into_texts),
            RunnableLambda(self.vector_db.upsert_records_into_vdb)
        )

        parallel_chain = RunnableParallel({
            "context": RunnableLambda(self.vector_db.retrieve_context) | RunnableLambda(format_docs),
            "user_query": RunnablePassthrough()
        })
        
        retriever_prompt_chain = parallel_chain | self.prompts.PROMPT 

        return {"load_store_chain": load_store_chain, "retriever_prompt_chain": retriever_prompt_chain}



async def initialize_ai_components(
    ai_model='meta-llama/llama-4-scout-17b-16e-instruct',
    temperature=0.7
):
    return Components(ai_model, temperature)