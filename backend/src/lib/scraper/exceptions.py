from __future__ import annotations


class SerpApiError(Exception):
    """Base exception."""


class SerpApiNetworkError(SerpApiError):
    """Network / transport failures."""


class SerpApiRateLimitError(SerpApiError):
    """429."""


class SerpApiAuthenticationError(SerpApiError):
    """401/403."""


class SerpApiServerError(SerpApiError):
    """5xx."""


class SerpApiBadRequestError(SerpApiError):
    """Invalid request."""


class SerpApiResponseError(SerpApiError):
    """SerpApi returned error payload."""