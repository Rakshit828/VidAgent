from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy.ext.asyncio.session import AsyncSession
from pydantic import EmailStr
from src.db.postgres_db import get_session
from src.config import CONFIG
from .schemas import (
    UserCreateSchema,
    UserResponseSchema,
    UserLogInSchema,
    AccessTokenSchema,
    TokensSchema,
    LoginResponseSchema
)
from .services import AuthService
from .dependencies import (
    RefreshTokenBearer,
    admin_checker,
    TokensInjector,
    AccessTokenBearer,
)
from .utils import create_jwt_tokens
from src.app_responses import SuccessResponse


REFRESH_TOKEN_EXPIRY_SECONDS = CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60
ACCESS_TOKEN_EXPIRY_MINUTES = CONFIG.ACCESS_TOKEN_EXPIRY_MINUTES * 60

auth_routes = APIRouter()
auth_service = AuthService()
tokens_injector = TokensInjector()

refresh_token_bearer = RefreshTokenBearer()


@auth_routes.post(
    "/signup",
    response_model=SuccessResponse[UserResponseSchema],
    status_code=status.HTTP_201_CREATED,
)
async def create_account(
    user_data: UserCreateSchema,
    session: AsyncSession = Depends(get_session),
) -> SuccessResponse[UserResponseSchema]:

    user = await auth_service.make_account(user_data=user_data, session=session)

    return SuccessResponse[UserResponseSchema](
        message="Account Created Successfully.",
        status_code=status.HTTP_201_CREATED,
        data=user,
    )


@auth_routes.post(
    "/login",
    response_model=SuccessResponse[LoginResponseSchema],
    status_code=status.HTTP_200_OK,
)
async def login(
    response: Response,
    user_data: UserLogInSchema,
    session: AsyncSession = Depends(get_session),
) -> SuccessResponse[LoginResponseSchema]:

    tokens = await auth_service.log_in_user(user_data, session)
    user = await auth_service.get_user_by_email(user_data.email, session)
    tokens = TokensSchema(**tokens)
    await tokens_injector.set_tokens_as_cookies(
        response=response, tokens=tokens, is_login=True
    )
    data = {
        "tokens": tokens,
        "user": user
    }
    return SuccessResponse[LoginResponseSchema](
        message="Logged In Successfully.", status_code=status.HTTP_200_OK, data=data
    )


@auth_routes.get("/logout", response_model=SuccessResponse[None], status_code=200)
async def logout_user(response: Response):
    # Logic to revoke the jwt token in future when Redis is implemented

    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="none",
    )
    return SuccessResponse[None](
        message="Logged Out Successfully.", status_code=status.HTTP_200_OK
    )




@auth_routes.get(
    "/user/me",
    response_model=SuccessResponse[UserResponseSchema],
    status_code=status.HTTP_200_OK,
)
async def get_user(
    decoded_token_data: dict = Depends(RefreshTokenBearer()),
    session: AsyncSession = Depends(get_session),
) -> SuccessResponse[UserResponseSchema]:
    user = await auth_service.get_user_by_uuid(decoded_token_data["sub"], session)
    return SuccessResponse[UserResponseSchema](
        message="User fetched successfully.", status_code=status.HTTP_200_OK, data=user
    )


@auth_routes.get("/refresh", response_model=SuccessResponse[AccessTokenSchema])
async def refresh_access_token(
    response: Response,
    token_data: dict = Depends(refresh_token_bearer),
) -> SuccessResponse[AccessTokenSchema]:

    user_uuid = token_data["sub"]
    role = token_data["role"]
    access_token = await create_jwt_tokens(
        user_uuid=user_uuid, role=role, is_login=False
    )
    access_token = AccessTokenSchema(**access_token)
    await tokens_injector.set_tokens_as_cookies(
        response=response, tokens=access_token, is_login=False
    )

    return SuccessResponse[AccessTokenSchema](
        message="Access Token Refreshed Successfully.",
        status_code=status.HTTP_200_OK,
        data=access_token.model_dump(),
    )




# ---------------------------- Admin Protected Routes ------------------------------
@auth_routes.get("/user/{email}", dependencies=[Depends(admin_checker)])
async def get_user(email: EmailStr, session: AsyncSession = Depends(get_session)):
    user = await auth_service.get_user_by_email(email, session)
    if not user:
        raise HTTPException(
            detail={"msg": "Email doesnot exist / Invalid Email"},
            status_code=status.HTTP_404_NOT_FOUND,
        )
    return user


@auth_routes.delete("/delete/{email}", dependencies=[Depends(admin_checker)])
async def delete_user(
    email: EmailStr,
    session: AsyncSession = Depends(get_session),
):
    user = await auth_service.delete_user(email, session)
    return {"msg": "User deleted"}
