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

    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_SERVER: str
    MAIL_PORT: int
    MAIL_FROM: str
    MAIL_FROM_NAME: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool
    USE_CREDENTIALS: bool
    VALIDATE_CERTS: bool

    model_config = SettingsConfigDict(
        env_file='.env',
        extra='ignore'
    )

CONFIG = Config()