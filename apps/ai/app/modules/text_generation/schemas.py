from __future__ import annotations

from typing import Annotated, ClassVar, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Wire format stays camelCase so web, Nest, and this service agree."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        # Allow modelId as a field despite Pydantic's reserved model_ prefix.
        protected_namespaces=(),
    )


TextGenerationModelId = Literal[
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemma-4-26b-a4b",
    "qwen-3.8-27b",
    "north-mini-code",
    "gpt-oss-20b",
]

TextGenerationProviderId = Literal[
    "google-ai-studio",
    "cloudflare-workers-ai",
    "openrouter",
    "groq",
]

TextGenerationErrorCode = Literal["rate_limit"]

DEFAULT_TEXT_GENERATION_MODEL_ID: TextGenerationModelId = "gemini-3.5-flash-lite"

Prompt = Annotated[str, StringConstraints(min_length=1)]


class TextGenerationRequest(CamelModel):
    model_id: TextGenerationModelId = DEFAULT_TEXT_GENERATION_MODEL_ID
    prompt: Prompt


class TextGenerationUsage(CamelModel):
    input_tokens: int | None = None
    output_tokens: int | None = None
    total_tokens: int | None = None


class GenerateTextResult(CamelModel):
    model_id: TextGenerationModelId
    provider_id: TextGenerationProviderId
    provider_model_id: str
    text: str
    usage: TextGenerationUsage | None = None


class PromptEnhancerResult(CamelModel):
    enhanced_prompt: str


class TextGenerationErrorResponse(CamelModel):
    """The failure body Nest forwards to the browser unchanged."""

    code: TextGenerationErrorCode
    error: str
    provider_id: TextGenerationProviderId | None = None
    provider_model_id: str | None = None
