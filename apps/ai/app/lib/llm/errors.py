from __future__ import annotations

import json
from typing import cast

from google.genai import errors as genai_errors

from app.modules.text_generation.schemas import (
    TextGenerationErrorCode,
    TextGenerationProviderId,
)


class ProviderHttpError(Exception):
    def __init__(self, message: str, status: int) -> None:
        super().__init__(message)
        self.message: str = message
        self.status: int = status


class TextGenerationError(Exception):
    def __init__(
        self,
        *,
        code: TextGenerationErrorCode,
        message: str,
        status: int,
        provider_id: TextGenerationProviderId | None = None,
        provider_model_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.code: TextGenerationErrorCode = code
        self.message: str = message
        self.status: int = status
        self.provider_id: TextGenerationProviderId | None = provider_id
        self.provider_model_id: str | None = provider_model_id


def map_provider_error(
    error: Exception,
    provider_id: TextGenerationProviderId,
    provider_model_id: str,
) -> Exception:
    # Wrap rate limits for the caller; leave other failures available for fallback.
    if _get_provider_status(error) != 429:
        return error

    return TextGenerationError(
        code="rate_limit",
        message=read_provider_error_message(error) or "Provider rate limit exceeded.",
        status=429,
        provider_id=provider_id,
        provider_model_id=provider_model_id,
    )


def read_provider_error_message(error: Exception) -> str | None:
    # Google may return error.message inside a JSON envelope.
    if isinstance(error, genai_errors.APIError):
        message = error.message or ""
    elif isinstance(error, ProviderHttpError):
        message = error.message
    else:
        return None

    try:
        payload = cast(object, json.loads(message))
    except ValueError:
        return message or None

    if not isinstance(payload, dict):
        return message or None

    error_payload = cast(dict[str, object], payload).get("error")

    if not isinstance(error_payload, dict):
        return message or None

    nested = cast(dict[str, object], error_payload).get("message")
    return nested if isinstance(nested, str) and nested else (message or None)


def _get_provider_status(error: Exception) -> int | None:
    if isinstance(error, genai_errors.APIError):
        return error.code

    if isinstance(error, ProviderHttpError):
        return error.status

    return None
