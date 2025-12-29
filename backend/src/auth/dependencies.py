from fastapi.security import APIKeyCookie
from fastapi import Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio.session import AsyncSession
from typing import Literal

from src.config import CONFIG
from src.db.postgres_db import get_session
from src.auth.models import Users
from src.app_responses import AppError
from .utils import decode_jwt_tokens
from .exceptions import InvalidJWTTokenError
from .services import AuthService
from .schemas import (
    TokenCookieDevConfig,
    TokenCookieProductionConfig,
    TokensSchema,
    AccessTokenSchema,
)

auth_service = AuthService()


class TokensInjector:
    def __init__(
        self,
        prod_config: TokenCookieProductionConfig = TokenCookieProductionConfig(),
        dev_config: TokenCookieDevConfig = TokenCookieDevConfig(),
    ):
        self.prod_config = prod_config
        self.dev_config = dev_config
    
    def set_cookies_age(self, cookie_key: Literal['access_token', 'refresh_token']):
        if cookie_key == 'access_token':
            return int(CONFIG.ACCESS_TOKEN_EXPIRY_MINUTES * 60)
        elif cookie_key == 'refresh_token':
            return int(CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60)
       

    async def set_tokens_as_cookies(
        self,
        response: Response,
        tokens: TokensSchema | AccessTokenSchema,
        is_login: bool,
    ):
        if CONFIG.IS_DEV:
            if is_login:
                for key, value in tokens.model_dump().items():
                    response.set_cookie(
                        key=key,
                        value=value,
                        max_age=self.set_cookies_age(cookie_key=key),
                        **self.dev_config.model_dump(),
                    )
            else:
                response.set_cookie(
                    key="access_token",
                    max_age=self.set_cookies_age(cookie_key='access_token'),
                    value=tokens.access_token,
                    **self.dev_config.model_dump(),
                )
        else:
            if is_login:
                for key, value in tokens.model_dump().items():
                    response.set_cookie(
                        key=key,
                        value=value,
                        max_age=self.set_cookies_age(cookie_key=key),
                        **self.prod_config.model_dump(),
                    )
            else:
                # Only sets up the access token
                response.set_cookie(
                    key="access_token",
                    max_age=self.set_cookies_age(cookie_key='access_token'),
                    value=tokens.access_token,
                    **self.dev_config.model_dump(),
                )


class RefreshTokenBearer(APIKeyCookie):
    def __init__(self):
        super().__init__(name="refresh_token", auto_error=False)

    async def __call__(self, request: Request):
        refresh_token = await super().__call__(request=request)
        if refresh_token is None:
            raise AppError(InvalidJWTTokenError[None]())
        decoded_token = decode_jwt_tokens(jwt_token=refresh_token)
        return decoded_token


class AccessTokenBearer(APIKeyCookie):
    def __init__(self):
        super().__init__(name="access_token", auto_error=False)

    async def __call__(self, request: Request):
        access_token = await super().__call__(request=request)
        if access_token is None:
            raise AppError(InvalidJWTTokenError())
        decoded_token = decode_jwt_tokens(jwt_token=access_token)
        return decoded_token


async def get_current_user(
    session: AsyncSession = Depends(get_session),
    token_data=Depends(AccessTokenBearer()),
):
    user_uid = token_data["sub"]
    result = await auth_service.get_user_by_uuid(user_uid, session)
    if result is not None:
        return result

    raise HTTPException(
        detail="UUID doesnot exist / Invalid UUID",
        status_code=status.HTTP_404_NOT_FOUND,
    )


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Users = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail={"Method not allowed"}
            )


admin_checker = RoleChecker(["admin"])
