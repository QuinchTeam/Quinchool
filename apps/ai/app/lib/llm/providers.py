"""One call to one provider. No fallback, no tracing, no app types beyond the
usage numbers every provider reports.

Port of apps/api/src/text-generation/providers/*.ts. The adapter layer that sat
between them and the service is gone: the four calls already return the same
shape, so there was nothing left for it to translate.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import NamedTuple, cast

import httpx
from google import genai

from app.core.config import get_settings
from app.lib.llm.errors import ProviderHttpError
from app.validations.text_generation import (
    TextGenerationProviderId,
    TextGenerationUsage,
)

# One prompt, one answer. Long enough for a slow open-weight model, short
# enough that a hung provider still leaves time for the next one in the chain.
GENERATION_TIMEOUT_SECONDS = 120.0

CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4/accounts"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

_google_client: genai.Client | None = None


class ProviderText(NamedTuple):
    text: str
    usage: TextGenerationUsage | None


def get_google_client() -> genai.Client:
    global _google_client

    if _google_client is None:
        api_key = get_settings().gemini_api_key.strip()

        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        _google_client = genai.Client(api_key=api_key)

    return _google_client


async def generate_google_ai_studio(
    prompt: str, provider_model_id: str
) -> ProviderText:
    response = await get_google_client().aio.models.generate_content(  # pyright: ignore[reportUnknownMemberType]
        model=provider_model_id,
        contents=prompt,
        # Nothing here calls a tool, and leaving AFC on makes the SDK warn that
        # generate_content is the wrong place for it.
        config={"automatic_function_calling": {"disable": True}},
    )
    text = (response.text or "").strip()

    if not text:
        raise RuntimeError("Google AI Studio returned no text output")

    metadata = response.usage_metadata

    return ProviderText(
        text=text,
        usage=TextGenerationUsage(
            input_tokens=metadata.prompt_token_count if metadata else None,
            output_tokens=metadata.candidates_token_count if metadata else None,
            total_tokens=metadata.total_token_count if metadata else None,
        ),
    )


async def generate_cloudflare_workers_ai(
    prompt: str, provider_model_id: str
) -> ProviderText:
    settings = get_settings()
    account_id = settings.cloudflare_account_id.strip()
    api_token = settings.cloudflare_api_token.strip()

    if not account_id or not api_token:
        raise RuntimeError(
            "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be configured"
        )

    body = await _post_json(
        url=f"{CLOUDFLARE_API_URL}/{account_id}/ai/run/{provider_model_id}",
        api_key=api_token,
        payload={"messages": [{"role": "user", "content": prompt}]},
        label="Cloudflare Workers AI",
    )
    result = _read_dict(body, "result")
    # Chat models answer under choices; the older text models answer under
    # response. Both shapes come back from the same endpoint.
    text = _read_choice_text(result) or _read_str(result, "response").strip()

    if not text:
        raise RuntimeError("Cloudflare Workers AI returned no text output")

    return ProviderText(text=text, usage=_read_usage(_read_dict(result, "usage")))


async def generate_groq(prompt: str, provider_model_id: str) -> ProviderText:
    return await _generate_openai_chat(
        api_key=_require_key(get_settings().groq_api_key, "GROQ_API_KEY"),
        label="Groq",
        prompt=prompt,
        provider_model_id=provider_model_id,
        url=GROQ_API_URL,
    )


async def generate_openrouter(prompt: str, provider_model_id: str) -> ProviderText:
    return await _generate_openai_chat(
        api_key=_require_key(get_settings().openrouter_api_key, "OPENROUTER_API_KEY"),
        label="OpenRouter",
        prompt=prompt,
        provider_model_id=provider_model_id,
        url=OPENROUTER_API_URL,
    )


TEXT_GENERATION_PROVIDERS: dict[
    TextGenerationProviderId, Callable[[str, str], Awaitable[ProviderText]]
] = {
    "google-ai-studio": generate_google_ai_studio,
    "cloudflare-workers-ai": generate_cloudflare_workers_ai,
    "openrouter": generate_openrouter,
    "groq": generate_groq,
}


async def _generate_openai_chat(
    *, api_key: str, label: str, prompt: str, provider_model_id: str, url: str
) -> ProviderText:
    """Groq and OpenRouter both speak the OpenAI chat-completions shape."""
    body = await _post_json(
        url=url,
        api_key=api_key,
        payload={
            "model": provider_model_id,
            "messages": [{"role": "user", "content": prompt}],
        },
        label=label,
    )
    text = _read_choice_text(body)

    if not text:
        raise RuntimeError(f"{label} returned no text output")

    return ProviderText(text=text, usage=_read_usage(_read_dict(body, "usage")))


async def _post_json(
    *, url: str, api_key: str, payload: dict[str, object], label: str
) -> dict[str, object]:
    async with httpx.AsyncClient(timeout=GENERATION_TIMEOUT_SECONDS) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

    try:
        parsed = cast(object, response.json())
    except ValueError:
        parsed = None

    body = cast(dict[str, object], parsed) if isinstance(parsed, dict) else {}

    if response.is_error:
        raise ProviderHttpError(
            _read_provider_message(body)
            or f"{label} request failed ({response.status_code})",
            response.status_code,
        )

    return body


def _require_key(value: str, name: str) -> str:
    key = value.strip()

    if not key:
        raise RuntimeError(f"{name} is not configured")

    return key


def _read_provider_message(body: dict[str, object]) -> str:
    """OpenAI-shaped providers report `error.message`; Cloudflare reports the
    first entry of an `errors` array.
    """
    message = _read_str(_read_dict(body, "error"), "message")

    if message:
        return message

    errors = body.get("errors")
    first = errors[0] if isinstance(errors, list) and errors else None

    return _read_str(cast(dict[str, object], first), "message") if isinstance(first, dict) else ""


def _read_choice_text(body: dict[str, object]) -> str:
    choices = body.get("choices")
    first = choices[0] if isinstance(choices, list) and choices else None

    if not isinstance(first, dict):
        return ""

    message = _read_dict(cast(dict[str, object], first), "message")

    return _read_str(message, "content").strip()


def _read_usage(usage: dict[str, object]) -> TextGenerationUsage | None:
    if not usage:
        return None

    return TextGenerationUsage(
        input_tokens=_read_int(usage, "prompt_tokens"),
        output_tokens=_read_int(usage, "completion_tokens"),
        total_tokens=_read_int(usage, "total_tokens"),
    )


def _read_dict(body: dict[str, object], key: str) -> dict[str, object]:
    value = body.get(key)

    return cast(dict[str, object], value) if isinstance(value, dict) else {}


def _read_str(body: dict[str, object], key: str) -> str:
    value = body.get(key)

    return value if isinstance(value, str) else ""


def _read_int(body: dict[str, object], key: str) -> int | None:
    value = body.get(key)

    return value if isinstance(value, int) else None
