from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from datetime import datetime
from typing import List


class UserCreateSchema(BaseModel):
    first_name: str = Field(alias='firstName')
    last_name: str = Field(alias='lastName')
    username: str =  Field(alias='firstName')
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

    class Config:
        orm_model = True


class RegisterAccountResponseSchema(BaseModel):
    data: UserResponseSchema
    message: str

class TokensSchema(BaseModel):
    access_token: str
    refresh_token: str


class AccessTokenSchema(BaseModel):
    access_token: str


class EmailModel(BaseModel):
    addresses: List[EmailStr]