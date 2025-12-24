from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
from contextlib import asynccontextmanager

from src.config import CONFIG
from src.ai.components import Components

from src.ai.agent import Agent

load_dotenv()

VERSION = 'v1'

@asynccontextmanager
async def lifespan(app: FastAPI):
    components: Components = await Components.init()

    app.state.agent = Agent()
    app.state.components = components
    yield


app = FastAPI(
    title="ChatTube",
    version=VERSION,
    lifespan=lifespan
    # The lifespan event expects a context manager
)


# Define allowed origins
origins = [
    CONFIG.FRONTEND_URL
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