from fastapi.security import HTTPBearer, APIKeyCookie
from fastapi import Request, Depends
from fastapi import HTTPException, status
from .utils import decode_jwt_tokens
from .services import AuthService
from sqlmodel.ext.asyncio.session import AsyncSession
from src.db.main import get_session
from .models import Users
from .exceptions import (
    InvalidJWTTokenError
)

auth_service = AuthService()

class RefreshTokenBearer(APIKeyCookie):
    async def __call__(self, request: Request):
        refresh_token =  await super().__call__(request)
        if refresh_token is None:
            raise InvalidJWTTokenError()
        decoded_token = decode_jwt_tokens(jwt_token=refresh_token)
        return decoded_token
    

class TokenBearer(HTTPBearer):
    async def __call__(self, request: Request):
        scheme_and_credentials =  await super().__call__(request)
        credentials = scheme_and_credentials.credentials

        # Credentials is JWT token
        #  If any error occurs it is raised. Hence, in this line, the token is already validated.
        decoded_token = decode_jwt_tokens(jwt_token=credentials)
        return decoded_token
        

class AccessTokenBearer(TokenBearer):
    pass


async def get_current_user(session: AsyncSession = Depends(get_session), token_data = Depends(AccessTokenBearer())):
    user_uid = token_data['sub']
    result = await auth_service.get_user_by_uuid(user_uid, session)
    if result is not None:
        return result

    raise HTTPException(
        detail="UUID doesnot exist / Invalid UUID",
        status_code=status.HTTP_404_NOT_FOUND
    )


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Users = Depends(get_current_user) ):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "Method not allowed"
                }
            )

admin_checker = RoleChecker(['admin'])
