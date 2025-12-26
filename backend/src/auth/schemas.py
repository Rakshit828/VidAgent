from pydantic import BaseModel, Field, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Literal, List


class TokenCookieDevConfig(BaseModel):
    path: str = "/"
    httponly: bool = True
    secure: bool = False
    samesite: Literal['lax', 'strict', 'none'] = 'lax'
  
        
class TokenCookieProductionConfig(BaseModel):
    path: str = "/"
    httponly: bool = True
    secure: bool = True
    samesite: Literal['lax', 'strict', 'none'] = 'none'


class TokensSchema(BaseModel):
    access_token: str
    refresh_token: str

class AccessTokenSchema(BaseModel):
    access_token: str



class UserCreateSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr 
    password: str 


class UserLogInSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=40)


class UserResponseSchema(BaseModel):
    uuid: UUID
    first_name: str
    last_name: str
    email: EmailStr
    is_verified: bool
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LoginResponseSchema(BaseModel):
    tokens: TokensSchema
    user: UserResponseSchema



class RegisterAccountResponseSchema(BaseModel):
    data: UserResponseSchema
    message: str



class EmailModel(BaseModel):
    addresses: List[EmailStr]