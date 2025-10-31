from passlib.context import CryptContext
from jwt import decode, encode
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from src.config import CONFIG
import uuid
from datetime import datetime, timedelta, timezone
from .exceptions import (
    ExpiredAccessTokenError,
    ExpiredRefreshTokenError,
    InvalidJWTTokenError,
)
from itsdangerous import URLSafeTimedSerializer

REFRESH_TOKEN_EXPIRY = timedelta(days=CONFIG.REFRESH_TOKEN_EXPIRY_DAYS)
ACCESS_TOKEN_EXPIRY = timedelta(minutes=CONFIG.ACCESS_TOKEN_EXPIRY_MINUTES)


SERIALIZER = URLSafeTimedSerializer(
    secret_key=CONFIG.JWT_SECRET_KEY, salt="email-verifier"
)


password_context = CryptContext(schemes=["argon2"], deprecated="auto")


def generate_password_hash(password):
    hashed_password = password_context.hash(secret=password)
    return hashed_password


def verify_user(password, hashed_password) -> True | False:
    is_verified = password_context.verify(secret=password, hash=hashed_password)
    return is_verified


async def create_jwt_tokens(
    user_uuid: uuid.UUID, role: str, is_login: bool
) -> dict:
    """
        This function is used to create both access and refresh token:
        
        For both tokens:
        ```python
        tokens = await create_jwt_tokens(user_uuid, role, is_login = True)
        ```
    
        For access token: 
        ```python
        access_token = await create_jwt_tokens(user_uuid, role, is_login = False)
        ```
    """
    now = datetime.now(timezone.utc)
    

    access_payload = {
        "jti": str(uuid.uuid4()),
        "sub": str(user_uuid),
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + ACCESS_TOKEN_EXPIRY,
    }
    access_token = encode(
        payload=access_payload,
        key=CONFIG.JWT_SECRET_KEY,
        algorithm=CONFIG.JWT_ALGORITHM,
    )

    if is_login:
        refresh_payload = {
            "jti": str(uuid.uuid4()),
            "sub": str(user_uuid),
            "role": role,
            "type": "refresh",
            "iat": now,
            "exp": now + REFRESH_TOKEN_EXPIRY,
        }
        refresh_token = encode(
            payload=refresh_payload,
            key=CONFIG.JWT_SECRET_KEY,
            algorithm=CONFIG.JWT_ALGORITHM,
        )
    
    if is_login is True:
        return {"access_token": access_token, "refresh_token": refresh_token}
    else:
        return { "access_token": access_token }
    


def decode_jwt_tokens(jwt_token: str, is_refresh: bool = False):
    try:
        decoded_jwt = decode(
            jwt=jwt_token,
            key=CONFIG.JWT_SECRET_KEY,
            algorithms=[CONFIG.JWT_ALGORITHM],
        )
        return decoded_jwt

    except ExpiredSignatureError:
        raise (
            ExpiredAccessTokenError()
            if is_refresh is False
            else ExpiredRefreshTokenError()
        )
    except InvalidTokenError:
        raise InvalidJWTTokenError()


async def create_url_safe_token(email):
    try:
        token = SERIALIZER.dumps(obj=email)
        return token
    except Exception as e:
        print(e)



async def decode_url_safe_token(token: str):
    try:
        decoded_token = SERIALIZER.loads(token)
        print("Decoded token: ", decoded_token)
        return str(decoded_token)

    except Exception as e:
        print(e)
