from fastapi import status
from src.app_responses import ErrorResponse, T


class InvalidTokenSchemaError(ErrorResponse[T]):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    status: str = "error"
    error: str = "invalid_token_schema_error"
    message: str = "Given dictionary is invalid for the tokens setup in cookies"
    data: T | None = None


# Authentication-related Errors
class EmailValidationError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    status: str = "error"
    error: str = "invalid_email_error"
    message: str = "Entered Email is Invalid"
    data: T | None = None


class ExpiredAccessTokenError(ErrorResponse[T]):
    status_code: int = status.HTTP_401_UNAUTHORIZED
    status: str = "error"
    error: str = "expired_access_token_error"
    message: str = "Access token has expired"
    data: T | None = None


class ExpiredRefreshTokenError(ErrorResponse[T]):
    status_code: int = status.HTTP_401_UNAUTHORIZED
    status: str = "error"
    error: str = "expired_refresh_token_error"
    message: str = "Refresh token has expired"
    data: T | None = None


class InvalidJWTTokenError(ErrorResponse[T]):
    status_code: int = status.HTTP_401_UNAUTHORIZED
    status: str = "error"
    error: str = "invalid_jwt_token_error"
    message: str = "JWT token is invalid"
    data: T | None = None


# User-related Errors
class InvalidEmailError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    status: str = "error"
    error: str = "invalid_email_error"
    message: str = "Entered email is invalid"
    data: T | None = None


class EmailNotFoundError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    status: str = "error"
    error: str = "email_not_found_error"
    message: str = "Email is not registered. Please register first."
    data: T | None = None


class EmailNotVerifiedError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    status: str = "error"
    error: str = "email_not_verified_error"
    message: str = "Email is not verified"
    data: T | None = None


class EmailAlreadyExistsError(ErrorResponse[T]):
    status_code: int = status.HTTP_409_CONFLICT
    status: str = "error"
    error: str = "email_already_exists_error"
    message: str = "Email already exists"
    data: T | None = None


class InvalidPasswordError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    status: str = "error"
    error: str = "invalid_password_error"
    message: str = "Entered password is invalid"
    data: T | None = None


class UserNotActiveError(ErrorResponse[T]):
    status_code: int = status.HTTP_403_FORBIDDEN
    status: str = "error"
    error: str = "user_not_active_error"
    message: str = "User account is not active"
    data: T | None = None


class UserNotFoundError(ErrorResponse[T]):
    status_code: int = status.HTTP_400_BAD_REQUEST
    status: str = "error"
    error: str = "user_not_found_error"
    message: str = "User account is not found"
    data: T | None = None

class AccountLockedError(ErrorResponse[T]):
    status_code: int = status.HTTP_423_LOCKED
    status: str = "error"
    error: str = "account_locked_error"
    message: str = "User account is locked"
    data: T | None = None


# Access Control Errors
class PermissionDeniedError(ErrorResponse[T]):
    status_code: int = status.HTTP_403_FORBIDDEN
    status: str = "error"
    error: str = "permission_denied_error"
    message: str = "You do not have permission to perform this action"
    data: T | None = None


class TooManyRequestsError(ErrorResponse[T]):
    status_code: int = status.HTTP_429_TOO_MANY_REQUESTS
    status: str = "error"
    error: str = "too_many_requests_error"
    message: str = "Too many requests. Slow down."
    data: T | None = None
