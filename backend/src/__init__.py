from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from loguru import logger

from src.app_responses import AppError
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
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



@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    logger.error(
        f"Error occurred: {exc.error_response.error}, "
        f"Message: {exc.error_response.message}, "
        f"Status: {exc.error_response.status_code}, "
        f"Path: {request.url.path}"
    )
    return JSONResponse(
        status_code=exc.error_response.status_code,  # This status code is of the JSONResponse itself
        content=exc.error_response.model_dump(),  # Our response resides here
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Convert Pydantic errors into your structure
    error_msg = ""
    missing_fields = ""
    for error in exc.errors():
        if error["type"] == "missing":
            missing_fields = missing_fields + error["loc"][1] + ", "
        elif error["type"] == "json_invalid":
            error_msg = "Invalid Json Structure."

    if missing_fields:
        error_msg = f"Missing {missing_fields}"

    logger.error(
        f"Error occurred: {[error['type'] for error in exc.errors()]}, "
        f"Message: {error_msg if error_msg else exc.errors()}, "
        f"Status: {400}, "
        f"Path: {request.url.path}"
    )

    return JSONResponse(
        status_code=400,
        content={
            "status": "error",
            "status_code": 400,
            "error": "validation_error",
            "message": error_msg,
        },
    )


app.include_router(chats_router, tags=['Chats'], prefix=f"/api/{VERSION}/chats")
app.include_router(auth_routes, tags=['Authentication'], prefix=f"/api/{VERSION}/auth")