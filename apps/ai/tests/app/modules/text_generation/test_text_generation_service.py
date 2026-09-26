from typing import final
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

import httpx

from app.lib.llm.errors import ProviderHttpError, TextGenerationError
from app.lib.llm.models import TEXT_GENERATION_MODELS, get_provider_chain
from app.lib.llm.providers import ProviderText
from app.main import app
from app.modules.text_generation.schemas import (
    GenerateTextResult,
    TextGenerationModelId,
    TextGenerationUsage,
)
from app.modules.text_generation.service import generate_text


@final
class TextGenerationTest(IsolatedAsyncioTestCase):
    async def test_falls_through_to_the_next_provider(self) -> None:
        # gpt-oss-20b lists Groq, then OpenRouter, then Cloudflare.
        model_id: TextGenerationModelId = "gpt-oss-20b"
        self.assertEqual(
            [provider for provider, _ in get_provider_chain(model_id)],
            ["groq", "openrouter", "cloudflare-workers-ai"],
        )

        with patch.dict(
            "app.modules.text_generation.service.TEXT_GENERATION_PROVIDERS",
            {
                "groq": AsyncMock(side_effect=ProviderHttpError("groq is down", 503)),
                "openrouter": AsyncMock(
                    return_value=ProviderText(
                        text="answer", usage=TextGenerationUsage(input_tokens=3)
                    )
                ),
            },
        ):
            result = await generate_text(model_id, "hello")

        self.assertEqual(result.provider_id, "openrouter")
        self.assertEqual(result.provider_model_id, "openai/gpt-oss-20b:free")
        self.assertEqual(result.text, "answer")

    async def test_reports_the_last_failure_when_every_provider_fails(self) -> None:
        with patch.dict(
            "app.modules.text_generation.service.TEXT_GENERATION_PROVIDERS",
            {
                "google-ai-studio": AsyncMock(
                    side_effect=ProviderHttpError(
                        '{"error":{"message":"Quota exceeded."}}', 429
                    )
                )
            },
        ), self.assertRaises(TextGenerationError) as raised:
            _ = await generate_text("gemini-3.5-flash", "hello")

        self.assertEqual(raised.exception.status, 429)
        self.assertEqual(raised.exception.code, "rate_limit")
        self.assertEqual(raised.exception.message, "Quota exceeded.")
        self.assertEqual(raised.exception.provider_id, "google-ai-studio")

    async def test_every_model_has_at_least_one_provider(self) -> None:
        for model_id in TEXT_GENERATION_MODELS:
            self.assertTrue(get_provider_chain(model_id))

    async def test_generate_endpoint_returns_camel_case_json(self) -> None:
        result = GenerateTextResult(
            model_id="kimi-k2.6",
            provider_id="cloudflare-workers-ai",
            provider_model_id="@cf/moonshotai/kimi-k2.6",
            text="answer",
            usage=TextGenerationUsage(input_tokens=1, output_tokens=2),
        )

        with patch(
            "app.modules.text_generation.router.generate_text",
            new=AsyncMock(return_value=result),
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/text-generation",
                    json={"modelId": "kimi-k2.6", "prompt": "hello"},
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["providerId"], "cloudflare-workers-ai")
        self.assertEqual(response.json()["usage"]["outputTokens"], 2)

    async def test_enhancer_endpoint_forwards_a_rate_limit(self) -> None:
        error = TextGenerationError(
            code="rate_limit",
            message="Quota exceeded.",
            status=429,
            provider_id="groq",
            provider_model_id="openai/gpt-oss-20b",
        )

        with patch(
            "app.modules.text_generation.router.enhance_prompt",
            new=AsyncMock(side_effect=error),
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/prompt-enhancer",
                    json={"modelId": "gpt-oss-20b", "prompt": "hello"},
                )

        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {
                "code": "rate_limit",
                "error": "Quota exceeded.",
                "providerId": "groq",
                "providerModelId": "openai/gpt-oss-20b",
            },
        )
