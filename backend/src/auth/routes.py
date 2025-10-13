from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse, Response
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import EmailStr
from src.db.main import get_session
from .schemas import (
    UserCreateSchema,
    UserResponseSchema,
    UserLogInSchema,
    AccessTokenSchema,
    EmailModel,
)
from .services import AuthService
from .dependencies import  RefreshTokenBearer, admin_checker
from .utils import create_jwt_tokens
from src.mail_service import mail, create_message


auth_routes = APIRouter()
auth_service = AuthService()
refresh_token_bearer = RefreshTokenBearer(name="refresh_token")

REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60


@auth_routes.post(
    "/signup", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED
)
async def create_account(
    user_data: UserCreateSchema, session: AsyncSession = Depends(get_session)
) -> UserResponseSchema:

    user = await auth_service.make_account(user_data=user_data, session=session)
    print(user)

    return user


@auth_routes.post(
    "/login", response_model=AccessTokenSchema, status_code=status.HTTP_200_OK
)
async def login(
    response: Response,
    user_data: UserLogInSchema,
    session: AsyncSession = Depends(get_session),
) -> AccessTokenSchema:

    tokens = await auth_service.log_in_user(user_data, session)
    response.set_cookie(
        path="/",
        key="refresh_token",
        value=tokens.get("refresh_token"),
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRY,
        domain="localhost",
    )
    return {"access_token": tokens.get("access_token")}


@auth_routes.get("/logout")
async def logout_user():
    # Logic to revoke the jwt token in future when Redis is implemented

    response = JSONResponse({"msg": "Logged out successfully"})
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=False,
        samesite="lax",
        domain="localhost",
    )
    return response


@auth_routes.get("/refresh", response_model=AccessTokenSchema)
async def refresh_access_token(
    token_data: dict = Depends(refresh_token_bearer),
) -> AccessTokenSchema:

    user_uuid = token_data["sub"]
    role = token_data["role"]
    new_access_token = await create_jwt_tokens(
        user_uuid=user_uuid, role=role, access=True
    )
    return new_access_token


@auth_routes.post("/sendmail")
async def send_mail(emails: EmailModel):
    addresses = emails.addresses
    message = await create_message(
        recipients=addresses, subject="Welcome To The App", msg_type="welcome"
    )
    await mail.send_message(message=message)
    return JSONResponse(content={"message": "Email sent successfully !!!"})


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
