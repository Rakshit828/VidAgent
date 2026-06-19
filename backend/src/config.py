from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    SERPAPI_BASE_URL: str
    YOUTUBE_VIDEO_TRANSCRIPT_ENGINE: str
    YOUTUBE_VIDEO_ENGINE: str
    SERP_API_KEY: str

    FRONTEND_URL: str
    BACKEND_URL: str 

    WEAVIATE_API_KEY: str 
    WEAVIATE_URL: str 
    WEAVIATE_COLLECTION_NAME: str 
    AUTOSCHEMA_ENABLED: str 

    IS_DEV: bool

    GROQ_API_KEY: str

    REFRESH_TOKEN_EXPIRY_DAYS: int
    ACCESS_TOKEN_EXPIRY_MINUTES: int

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


CONFIG = Config()  # type: ignore
