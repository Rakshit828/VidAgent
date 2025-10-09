from passlib.context import CryptContext
from jwt import decode, encode
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from src.config import CONFIG
import uuid
from datetime import datetime, timedelta, timezone
from .exceptions import ExpiredJWTTokenError
from itsdangerous import URLSafeTimedSerializer



REFRESH_TOKEN_EXPIRY = timedelta(days=7)
ACCESS_TOKEN_EXPIRY = timedelta(minutes=15)

SERIALIZER = URLSafeTimedSerializer(
    secret_key=CONFIG.JWT_SECRET_KEY,
    salt="email-verifier"
)


password_context = CryptContext(schemes=['bcrypt'])

def generate_password_hash(password):
    hashed_password = password_context.hash(secret=password)
    return hashed_password

def verify_user(password, hashed_password) -> True | False:
    is_verified = password_context.verify(secret=password, hash=hashed_password)
    return is_verified



async def create_jwt_tokens(user_uuid: uuid.UUID, role: str, access: bool = False) -> dict:
    now = datetime.now(timezone.utc)

    access_payload = {
        "jti": str(uuid.uuid4()),
        "sub": str(user_uuid),
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + ACCESS_TOKEN_EXPIRY,
    }
    access_token = encode(payload=access_payload, key=CONFIG.JWT_SECRET_KEY, algorithm=CONFIG.JWT_ALGORITHM)

    if not access:
        refresh_payload = {
            "jti": str(uuid.uuid4()),
            "sub": str(user_uuid),
            "role": role,
            "type": "refresh",
            "iat": now,
            "exp": now + REFRESH_TOKEN_EXPIRY,
        }
        refresh_token = encode(payload=refresh_payload, key=CONFIG.JWT_SECRET_KEY, algorithm=CONFIG.JWT_ALGORITHM)
        return {"access_token": access_token, "refresh_token": refresh_token}
    else:
        return {"access_token": access_token}



def decode_jwt_tokens(jwt_token: str):
    try:
        decoded_jwt = decode(
            jwt=jwt_token,
            key=CONFIG.JWT_SECRET_KEY,
            algorithms=[CONFIG.JWT_ALGORITHM],
        )
        return decoded_jwt

    except ExpiredSignatureError:
        raise ExpiredJWTTokenError()
    except InvalidTokenError:
        raise ValueError("Invalid JWT token.")



def create_url_safe_token(body: dict):
    try:
        token = SERIALIZER.dumps(dict)
        return token
    
    except Exception as e:
        print(e)



def decode_url_safe_token(token: str):
    try:
        decoded_token = SERIALIZER.loads(token)
        return decoded_token
    
    except Exception as e:
        print(e)
