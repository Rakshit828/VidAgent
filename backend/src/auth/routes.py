from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse, Response, RedirectResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import EmailStr
from src.db.main import get_session
from src.config import CONFIG
from .schemas import (
    UserCreateSchema,
    UserResponseSchema,
    UserLogInSchema,
    AccessTokenSchema,
    EmailModel,
)
from .services import AuthService, EmailService
from .dependencies import RefreshTokenBearer, admin_checker
from .utils import create_jwt_tokens, decode_url_safe_token
from src.mail_service import mail, create_message


REFRESH_TOKEN_EXPIRY_SECONDS = CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60

auth_routes = APIRouter()
auth_service = AuthService()
email_service = EmailService()
refresh_token_bearer = RefreshTokenBearer(name="refresh_token")


@auth_routes.post(
    "/signup",
    response_model=UserResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_account(
    user_data: UserCreateSchema,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
) -> UserResponseSchema:
    
    user = await auth_service.make_account(user_data=user_data, session=session)
    
    await email_service.verification_email(email=user.email, background_tasks=background_tasks)

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

    if CONFIG.IS_DEV:
        response.set_cookie(
            path="/",
            key="refresh_token",
            value=tokens.get("refresh_token"),
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=REFRESH_TOKEN_EXPIRY_SECONDS,
        )

    else:
        response.set_cookie(
            path="/",
            key="refresh_token",
            value=tokens.get("refresh_token"),
            httponly=True,
            secure=True,
            samesite="none",
            max_age=REFRESH_TOKEN_EXPIRY_SECONDS,
        )
    return {"access_token": tokens.get("access_token")}



@auth_routes.get("/logout")
async def logout_user():
    # Logic to revoke the jwt token in future when Redis is implemented

    response = JSONResponse({"msg": "Logged out successfully"})
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="none",
    )
    return response


@auth_routes.get("/refresh", response_model=AccessTokenSchema)
async def refresh_access_token(
    token_data: dict = Depends(refresh_token_bearer),
) -> AccessTokenSchema:

    user_uuid = token_data["sub"]
    role = token_data["role"]
    new_access_token = await create_jwt_tokens(
        user_uuid=user_uuid, role=role, is_login=False
    )
    return new_access_token


@auth_routes.get("/get-verification-email/{email}")
async def get_verification_email(email: str, background_tasks: BackgroundTasks):
    await email_service.verification_email(email, background_tasks)
    return True



@auth_routes.get("/verify-email")
async def verify_email(
    token: str = Query(...), session: AsyncSession = Depends(get_session)
):
    email = await decode_url_safe_token(token=token)
    if not email:
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email verification failed"
        )
    await auth_service.update_is_verified(
        email=email, is_verified_value=True, session=session
    )
    return RedirectResponse(url=f"{CONFIG.FRONTEND_URL}/verify/login")




# ------------- Dummy Routes For Testing -----------------------------------------

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
