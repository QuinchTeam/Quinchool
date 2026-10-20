# Provider insertion order is the fallback order.

from __future__ import annotations

from app.modules.text_generation.schemas import (
    TextGenerationModelId,
    TextGenerationProviderId,
)

TEXT_GENERATION_MODELS: dict[
    TextGenerationModelId, dict[TextGenerationProviderId, str]
] = {
    "gemini-3.5-flash": {"google-ai-studio": "gemini-3.5-flash"},
    "gemini-3.1-flash-lite": {"google-ai-studio": "gemini-3.1-flash-lite"},
    "gemma-4-26b-a4b": {
        "google-ai-studio": "gemma-4-26b-a4b-it",
        "openrouter": "google/gemma-4-26b-a4b-it:free",
        "cloudflare-workers-ai": "@cf/google/gemma-4-26b-a4b-it",
    },
    "kimi-k2.7-code": {"cloudflare-workers-ai": "@cf/moonshotai/kimi-k2.7-code"},
    "kimi-k2.6": {"cloudflare-workers-ai": "@cf/moonshotai/kimi-k2.6"},
    "gpt-oss-20b": {
        "groq": "openai/gpt-oss-20b",
        "openrouter": "openai/gpt-oss-20b:free",
        "cloudflare-workers-ai": "@cf/openai/gpt-oss-20b",
    },
}


def get_provider_chain(
    model_id: TextGenerationModelId,
) -> list[tuple[TextGenerationProviderId, str]]:
    provider_models = TEXT_GENERATION_MODELS.get(model_id)

    if not provider_models:
        raise ValueError(f"No text-generation providers configured for: {model_id}")

    return list(provider_models.items())
