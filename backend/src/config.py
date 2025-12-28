from pydantic_settings import BaseSettings, SettingsConfigDict

class Config(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str

    FRONTEND_URL: str
    BACKEND_URL: str
    
    IS_DEV: bool
    
    RAPID_API_KEY: str
    RAPID_API_HOST: str

    REFRESH_TOKEN_EXPIRY_DAYS: int
    ACCESS_TOKEN_EXPIRY_MINUTES: int

    model_config = SettingsConfigDict(
        env_file='.env',
        extra='ignore'
    )

CONFIG = Config()