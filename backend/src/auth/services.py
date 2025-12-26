from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import BackgroundTasks
from .models import Users
from .schemas import UserCreateSchema, UserLogInSchema
from .utils import (
    generate_password_hash,
    verify_user,
    create_jwt_tokens,
    create_url_safe_token,
)
from src.mail_service import mail, create_verification_email_body, create_message
from src.config import CONFIG
from .exceptions import (
    InvalidEmailError,
    InvalidPasswordError,
    EmailAlreadyExistsError,
    EmailNotVerifiedError,
)
from src.app_responses import AppError


class EmailService:
    VERIFICATION_LINK = f"{CONFIG.BACKEND_URL}/api/v1/auth/verify-email?token="

    async def verification_email(self, email: str, background_tasks: BackgroundTasks):
        token = await create_url_safe_token(email=email)
        verification_link = self.VERIFICATION_LINK + token
        body = await create_verification_email_body(verification_link=verification_link)
        message = await create_message(
            recipients=[email], subject="Verify Email", body=body
        )
        background_tasks.add_task(mail.send_message, message)
        return True
    

class AuthService:

    async def get_user_by_uuid(self, user_uid: str, session: AsyncSession) -> Users | None:
        """Returns the user with the respective email"""

        statement = select(Users).where(Users.uuid == user_uid)
        result = await session.execute(statement)
        user = result.scalar_one_or_none()
        return user

    async def get_user_by_email(self, email: str, session: AsyncSession) -> Users | None:
        """Returns the user with the respective email"""

        statement = select(Users).where(Users.email == email)
        result = await session.execute(statement)
        result: Users | None = result.scalar_one_or_none()
        return result
    
    async def delete_not_verified_users(self, session: AsyncSession):
        statement = select(Users).where(Users.is_verified == False)
        result = await session.execute(statement)
        for user in result.all():
            await session.delete(user)
        await session.commit()

    async def update_is_verified(
        self, email: str, is_verified_value: bool, session: AsyncSession
    ):
        user = await self.get_user_by_email(email=email, session=session)
        user.is_verified = is_verified_value
        await session.commit()
        return user

    async def check_is_verified(self, email: str, session: AsyncSession):
        user = await self.get_user_by_email(email=email, session=session)
        is_verified: bool = user.is_verified
        return is_verified

    async def delete_user(self, email: str, session: AsyncSession):
        user = await self.get_user_by_email(email, session)
        if not user:
            raise AppError(InvalidEmailError[None]())

        await session.delete(user)
        await session.commit()
        return

    async def log_in_user(self, user_data: UserLogInSchema, session: AsyncSession):
        """Verifies the user and issues both the Access and Refresh Tokens"""

        user_data_dict = user_data.model_dump()
        email = user_data_dict.get("email")
        user = await self.get_user_by_email(email, session)

        if not user:
            raise AppError(InvalidEmailError[None]())

        # if not user.is_verified:
        #     raise EmailNotVerifiedError()

        password = user_data_dict.get("password")
        hashed_password = user.hashed_password
        is_verified = verify_user(password, hashed_password)

        if not is_verified:
            raise AppError(InvalidPasswordError[None]())

        uuid = user.uuid
        role = user.role

        tokens = await create_jwt_tokens(user_uuid=uuid, role=role, is_login=True)
        return tokens

    async def make_account(self, user_data: UserCreateSchema, session: AsyncSession):
        """Creates the user account on the database"""
        user_data_dict = user_data.model_dump()

        email = user_data_dict.get("email")
        user_exists = await self.get_user_by_email(email, session)

        if user_exists:
            raise AppError(EmailAlreadyExistsError[None]())

        password = user_data_dict.get("password")
        hashed_password = generate_password_hash(password)
        user_data_dict["hashed_password"] = hashed_password
        user_data_dict.pop("password")

        new_user = Users(**user_data_dict)
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)

        return new_user
