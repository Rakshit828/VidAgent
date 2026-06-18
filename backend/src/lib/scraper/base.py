from __future__ import annotations

from typing import Any, Dict
from loguru import logger
import httpx
from src.config import CONFIG
from .exceptions import (
    SerpApiAuthenticationError,
    SerpApiBadRequestError,
    SerpApiNetworkError,
    SerpApiRateLimitError,
    SerpApiResponseError,
    SerpApiServerError,
)


class BaseSerpApiClient:
    BASE_URL = CONFIG.SERPAPI_BASE_URL

    def __init__(
        self,
        api_key: str | None = None,
        *,
        timeout: float = 30.0,
        max_connections: int = 100,
        max_keepalive_connections: int = 20,
    ) -> None:
        self.api_key = api_key or CONFIG.SERP_API_KEY
        limits = httpx.Limits(
            max_connections=max_connections,
            max_keepalive_connections=max_keepalive_connections,
        )
        self._client = httpx.AsyncClient(
            timeout=timeout,
            limits=limits,
            headers={
                "Accept": "application/json",
                "User-Agent": "serpapi-client/1.0",
            },
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def request(
        self,
        *,
        engine: str,
        params: dict[str, Any],
    ) -> dict[str, Any]:
        payload: Dict[str, Any] = {
            **params,
            "engine": engine,
            "api_key": self.api_key,
        }

        try:
            response: httpx.Response = await self._client.get(
                self.BASE_URL,
                params=payload,
            )

            self._raise_for_status(response)
            data = response.json()
            self._raise_for_serpapi_errors(data)
            return data

        except (
            httpx.ConnectError,
            httpx.ReadTimeout,
            httpx.ConnectTimeout,
            httpx.WriteTimeout,
            httpx.PoolTimeout,
        ) as exc:
            raise SerpApiNetworkError(str(exc)) from exc


    @staticmethod
    def _raise_for_status(
        response: httpx.Response,
    ) -> None:
        status = response.status_code

        if status < 400:
            return

        if status in (401, 403):
            raise SerpApiAuthenticationError(response.text)

        if status == 429:
            raise SerpApiRateLimitError(response.text)

        if 400 <= status < 500:
            raise SerpApiBadRequestError(response.text)

        if status >= 500:
            raise SerpApiServerError(response.text)

    @staticmethod
    def _raise_for_serpapi_errors(
        payload: dict[str, Any],
    ) -> None:
        error = payload.get("error")

        if error:
            logger.debug(f"The payload for error is : {payload}")
            raise SerpApiResponseError(error)
