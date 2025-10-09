from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain.text_splitter import SentenceTransformersTokenTextSplitter, RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda, RunnableSequence
from langchain.schema import Document
from langchain_core.prompts import PromptTemplate

from .youtube import load_video_transcript
from .exceptions import VectorDatabaseError, RetrieverError

from .utils import format_docs
from src.utils.utils import get_video_id



class VectorDatabase:
    def __init__(self, embedding_model):
        self.embedding_model = embedding_model
        self.vector_db = self.initialize_vector_db()


    def initialize_vector_db(self):
        vector_db = Chroma(
            collection_name="youtube_videos",
            persist_directory="chroma_db",
            embedding_function=self.embedding_model
        )
        return vector_db
    

    async def add_into_vector_store(self, video_data: dict[str, str]):
        # The video data has keys: user_id, video_id and splitted_transcript

        splitted_transcript = video_data['splitted_transcript']
        del video_data['splitted_transcript']
        metadata = video_data
        splitted_transcript_documents = [
            Document(
                page_content=individual_split, 
                metadata=metadata
            ) for individual_split in splitted_transcript
        ]

        try:
            await self.vector_db.aadd_documents(splitted_transcript_documents)
        except Exception:
            raise VectorDatabaseError()
        
        return True
    

    async def check_for_transcript(self, user_id, video_url_or_id):
        try:
            video_id = get_video_id(video_url_or_id)
            collection = self.vector_db._collection
            results = collection.get(
                where={
                    "$and": [
                        {"user_id": user_id},
                        {"video_id": video_id}
                    ]
                },
                limit=1
            )
            exists = len(results['ids']) > 0
            return exists
        except:
            raise VectorDatabaseError()
    

    async def delete_video_transcript(self, user_id, video_url_or_id):
        try:
            video_id = get_video_id(video_url_or_id)
            collection = self.vector_db._collection
            collection.delete(
                where={
                    "$and": [
                        {"user_id": user_id},
                        {"video_id": video_id}
                    ]
                }
            )
            return True
        except:
            raise VectorDatabaseError()


class Retriever:
    def __init__(self, vector_db: VectorDatabase):
        self.vector_db = vector_db.vector_db
        self.retriever = self.vector_db.as_retriever(
            search_type="similarity",
            k=4
        )

    async def retrieve_relevant_context(self, data) -> list[Document]:
        try:
            self.retriever.search_type = data['search_type']
            self.retriever.search_kwargs = data['search_kwargs']
            context = await self.retriever.ainvoke(input=data['query'])
            print("The context is \n \n", context)
            return context
        except:
            raise RetrieverError()


class Chunker:
    def __init__(self, embedding_model_name: HuggingFaceEmbeddings):
        self.splitter = SentenceTransformersTokenTextSplitter(
            model_name=embedding_model_name,
        )


    def split_transcript_into_texts(self, video_data: dict[str, str]):
        # The video data has keys : user_id, video_id, transcript_text
        transcript_text = video_data.get("transcript_text")
        splitted_transcript = self.splitter.split_text(text=transcript_text)
        
        del video_data['transcript_text']

        video_data.update({"splitted_transcript": splitted_transcript})

        return video_data


class PromptPicker:
    PROMPT = PromptTemplate(
        template="""
            You are given the context from a YouTube video transcript. 
            Answer the query using **only** the information provided in the context. 
            Do not include any information that is not present in the context.

            CONTEXT:
            {context}

            QUERY:
            {user_query}

            Answer as clearly and naturally as possible, using the context only.
        """,
        input_variables=['context', 'user_query']
    )



class Components:
    def __init__(self, 
        ai_model_name,
        embedding_model_name
    ):
        print("Loading AI components")

        self.llm = ChatGroq(model=ai_model_name, temperature=0.7)

        self.embedding_model = HuggingFaceEmbeddings(model_name=embedding_model_name)

        self.vector_db = VectorDatabase(embedding_model=self.embedding_model)

        self.retriever = Retriever(vector_db = self.vector_db)

        self.chunker = Chunker(embedding_model_name=embedding_model_name)
          
        self.prompts = PromptPicker()

        self.parser = StrOutputParser()

        self.chains = self.build_chains()


        print("Loaded all AI components")


    async def get_response_llm(self, prompt):
        response = await self.llm.ainvoke(prompt)
        return response


    def build_chains(self):
        load_store_chain = RunnableSequence(
            RunnableLambda(load_video_transcript),
            RunnableLambda(self.chunker.split_transcript_into_texts),
            RunnableLambda(self.vector_db.add_into_vector_store)
        )

        parallel_chain = RunnableParallel({
            "context": RunnableLambda(self.retriever.retrieve_relevant_context) | RunnableLambda(format_docs),
            "user_query": RunnablePassthrough()
        })
        
        retriever_response_chain = parallel_chain | self.prompts.PROMPT | RunnableLambda(self.get_response_llm) | self.parser

        return {"load_store_chain": load_store_chain, "retrieve_response_chain": retriever_response_chain}




def initialize_ai_components(
    ai_model='meta-llama/llama-4-scout-17b-16e-instruct',
    embedding_model='sentence-transformers/all-Mpnet-base-v2'
):
    return Components(ai_model, embedding_model)
