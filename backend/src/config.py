from pydantic_settings import BaseSettings, SettingsConfigDict

class Config(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    FRONTEND_URL: str
    BACKEND_URL: str
    
    IS_DEV: bool
    
    RAPID_API_KEY: str
    RAPID_API_HOST: str

    REFRESH_TOKEN_EXPIRY_DAYS: int
    ACCESS_TOKEN_EXPIRY_MINUTES: int

    RESEND_API_KEY: str
    MAIL_FROM_NAME: str
    RESEND_FROM_EMAIL: str

    model_config = SettingsConfigDict(
        env_file='.env',
        extra='ignore'
    )

CONFIG = Config()