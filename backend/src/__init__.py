from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
from contextlib import asynccontextmanager

from src.ai.components import initialize_ai_components
from src.db.main import init_db
from src.ai.pinecone_vdb import init_pinecone_db

load_dotenv()

VERSION = 'v1'

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    pinecone_db = await init_pinecone_db()

    ai_components =  await initialize_ai_components(ai_model="openai/gpt-oss-120b", temperature=0.7)

    ai_components.vector_db = pinecone_db
    ai_components.chains = await ai_components.build_chains()

    app.state.ai_components = ai_components

    yield


app = FastAPI(
    title="ChatTube",
    version=VERSION,
    lifespan=lifespan
    # The lifespan event expects a context manager
)


# Define allowed origins
origins = [
    "http://localhost:5173",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,     # allows cookies, authorization headers, etc.
    allow_methods=["*"],        # allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],        # allows all headers
)


from src.chats.routes import chats_router
from src.auth.routes import auth_routes

app.include_router(chats_router, tags=['Chats'], prefix=f"/api/{VERSION}/chats")
app.include_router(auth_routes, tags=['Authentication'], prefix=f"/api/{VERSION}/auth")