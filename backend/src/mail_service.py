from fastapi_mail import FastMail, ConnectionConfig, MessageSchema, MessageType
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


async def create_message(recipients: List[str], subject: str, msg_type: str):
    # Render the HTML template
    if msg_type == "welcome":
        welcome_template = await mail.get_mail_template(env_path=jinja_env, template_name="welcome.html")
        body = welcome_template.render({})
    elif msg_type == "verify_user":
        verify_template = await mail.get_mail_template(env_path=jinja_env, template_name="verify_email.html")
        body = verify_template.render({})

    # Create the message
    message = MessageSchema(
        recipients=recipients,
        subject=subject,
        body=body,
        subtype=MessageType.html
    )
    return message

