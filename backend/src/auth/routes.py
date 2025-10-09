from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from pydantic import EmailStr
from typing import TypedDict

from src.db.main import get_session
from .schemas import UserCreateSchema, UserResponseSchema, UserLogInSchema, TokensSchema, EmailModel
from .models import Users
from .services import AuthService
from .dependencies import AccessTokenBearer, RefreshTokenBearer, admin_checker
from .utils import create_jwt_tokens
from src.mail_service import mail, create_message

# The admin_checker will implement both the authentication and authorization

auth_routes = APIRouter()
auth_service = AuthService()


@auth_routes.post(
    '/signup', 
    response_model=UserResponseSchema,
    status_code=status.HTTP_201_CREATED
)
async def create_account(
    user_data: UserCreateSchema,
    session: AsyncSession = Depends(get_session)
) -> UserResponseSchema:
    
    user = await auth_service.make_account(user_data=user_data, session=session)
    print(user)

    return user



@auth_routes.post(
    '/login', 
    response_model=TokensSchema, 
    status_code=status.HTTP_200_OK
)
async def login(
    user_data: UserLogInSchema,
    session: AsyncSession = Depends(get_session)
) -> TokensSchema:
    tokens = await auth_service.log_in_user(user_data, session)
    return tokens



@auth_routes.get('/logout')
async def logout_user(
    token_data: dict = Depends(AccessTokenBearer())
):
    jti = token_data['jti']
    print(jti)
    return {"msg": "Logged out successfully"}



@auth_routes.get('/refresh')
async def refresh_access_token(
    token_data: dict = Depends(RefreshTokenBearer())
):
    user_uuid = token_data['sub']
    role = token_data['role']
 
    new_access_token = await create_jwt_tokens(user_uuid=user_uuid, role=role, access=True)
    print("NEW access token", new_access_token)
    return new_access_token



@auth_routes.post("/sendmail")
async def send_mail(emails: EmailModel):
    addresses = emails.addresses
    message = await create_message(
        recipients=addresses,
        subject="Welcome To The App",
        msg_type="welcome"
    )
    await mail.send_message(message=message)
    return JSONResponse(content={"message": "Email sent successfully !!!"})


# ---------------------------- Admin Protected Routes ------------------------------

@auth_routes.get('/user/{email}', dependencies=[Depends(admin_checker)])
async def get_user(
    email: EmailStr,
    session: AsyncSession = Depends(get_session)
):
    user = await auth_service.get_user_by_email(email, session)
    if not user:
        raise HTTPException(
            detail={"msg": "Email doesnot exist / Invalid Email"},
            status_code=status.HTTP_404_NOT_FOUND
        )
    return user



@auth_routes.delete('/delete/{email}', dependencies=[Depends(admin_checker)])
async def delete_user(
    email: EmailStr,
    session: AsyncSession = Depends(get_session),
    
):
    user = await auth_service.delete_user(email, session)
    return {"msg": "User deleted"}


