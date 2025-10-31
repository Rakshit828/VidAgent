from fastapi_mail import FastMail, ConnectionConfig, MessageSchema, MessageType
from src.auth.exceptions import EmailValidationError
from pydantic import ValidationError
from src.config import CONFIG
from pathlib import Path
from typing import List
from jinja2 import Environment, FileSystemLoader

BASE_DIR = Path(__file__).resolve().parent

templates_folder = Path(BASE_DIR, "templates")

jinja_env = Environment(loader=FileSystemLoader(templates_folder))

mail_config = ConnectionConfig(
    MAIL_USERNAME=CONFIG.MAIL_USERNAME,
    MAIL_PASSWORD=CONFIG.MAIL_PASSWORD,
    MAIL_FROM=CONFIG.MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER=CONFIG.MAIL_SERVER,
    MAIL_FROM_NAME=CONFIG.MAIL_FROM_NAME,
    MAIL_STARTTLS=CONFIG.MAIL_STARTTLS,
    MAIL_SSL_TLS=CONFIG.MAIL_SSL_TLS,
    USE_CREDENTIALS=CONFIG.USE_CREDENTIALS,
    VALIDATE_CERTS=CONFIG.VALIDATE_CERTS,
    TEMPLATE_FOLDER=Path(BASE_DIR, "templates"),
)


mail = FastMail(
    config=mail_config
)

async def create_verification_email_body(verification_link: str):
    print(verification_link)
    email_template = await mail.get_mail_template(env_path=jinja_env, template_name="verify_email.html")
    body = email_template.render(verification_link=verification_link)
    return body

async def create_welcome_email_body(name: str):
    email_template = await mail.get_mail_template(env_path=jinja_env, template_name="welcome.html")
    body = email_template.render(username = name)
    return body


async def create_message(recipients: List[str], subject: str, body: str):
    try:
        message = MessageSchema(
            recipients=recipients,
            subject=subject,
            body=body,
            subtype=MessageType.html
        )
    except ValidationError:
        raise EmailValidationError()
    
    return message

