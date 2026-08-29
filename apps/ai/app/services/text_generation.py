"""One prompt in, one answer out, with the next provider tried when one fails.

Port of apps/api/src/text-generation/{service.ts,prompts.ts}.
"""

from __future__ import annotations

from app.core.logging import log_event
from app.core.tracing import observe, usage_details
from app.lib.llm.errors import map_provider_error
from app.lib.llm.models import get_provider_chain
from app.lib.llm.providers import TEXT_GENERATION_PROVIDERS
from app.validations.text_generation import (
    GenerateTextResult,
    PromptEnhancerResult,
    TextGenerationModelId,
)

SERVICE = "text-generation"


async def generate_text(
    model_id: TextGenerationModelId, prompt: str
) -> GenerateTextResult:
    with observe(
        "generate-text",
        as_type="chain",
        input=prompt,
        metadata={"feature": SERVICE, "requestedModelId": model_id},
    ) as chain:
        last_error: Exception | None = None

        for provider_id, provider_model_id in get_provider_chain(model_id):
            with observe(
                "generate-response",
                as_type="generation",
                model=provider_model_id,
                input=[{"content": prompt, "role": "user"}],
                metadata={"providerId": provider_id, "requestedModelId": model_id},
            ) as generation:
                log_event(
                    "info",
                    SERVICE,
                    "provider.started",
                    {"providerId": provider_id, "providerModelId": provider_model_id},
                )

                try:
                    response = await TEXT_GENERATION_PROVIDERS[provider_id](
                        prompt, provider_model_id
                    )
                except Exception as error:  # noqa: BLE001 - the next provider gets its turn
                    last_error = map_provider_error(
                        error, provider_id, provider_model_id
                    )
                    _ = generation.update(level="ERROR", status_message=str(error))
                    log_event(
                        "warn",
                        SERVICE,
                        "provider.failed",
                        {
                            "errorMessage": str(error),
                            "errorName": type(error).__name__,
                            "providerId": provider_id,
                            "providerModelId": provider_model_id,
                        },
                    )
                    continue

                usage = response.usage
                _ = generation.update(
                    output=response.text,
                    usage_details=usage_details(
                        usage.input_tokens if usage else None,
                        usage.output_tokens if usage else None,
                    ),
                )
                _ = chain.update(
                    output=response.text,
                    metadata={
                        "feature": SERVICE,
                        "providerId": provider_id,
                        "providerModelId": provider_model_id,
                        "requestedModelId": model_id,
                    },
                )

                return GenerateTextResult(
                    model_id=model_id,
                    provider_id=provider_id,
                    provider_model_id=provider_model_id,
                    text=response.text,
                    usage=usage,
                )

        error = last_error or RuntimeError(
            f"Text generation failed for model: {model_id}"
        )
        _ = chain.update(level="ERROR", status_message=str(error))
        raise error


async def enhance_prompt(
    model_id: TextGenerationModelId, raw_prompt: str
) -> PromptEnhancerResult:
    result = await generate_text(model_id, build_enhanced_prompt(raw_prompt))

    return PromptEnhancerResult(enhanced_prompt=result.text)


def build_enhanced_prompt(raw_prompt: str) -> str:
    return f"""You are an expert prompt engineer. Turn the user's rough request into a polished, self-contained prompt that produces a strong result.

Preserve the user's intent. Add useful structure, clear constraints, relevant context, and an explicit output format only when they improve the request. Do not answer the request itself. Return only the enhanced prompt, with no preamble or explanation.

<raw-prompt>
{raw_prompt}
</raw-prompt>"""
