# app/services/oauth_service.py
from authlib.integrations.starlette_client import OAuth
from fastapi import HTTPException
import httpx
from src.config import CONFIG

oauth = OAuth()

oauth.register(
    name="google",
    client_id=CONFIG.GOOGLE_CLIENT_ID,
    client_secret=CONFIG.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


async def get_google_user_info(token: str) -> dict:
    """Fetch user info from Google using access token"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=400, detail="Failed to get user info from Google"
            )

        return response.json()
