"""HTTP surface for the two calls that are a single LLM round trip and nothing
else. Stateless: prompt in, text out.

Port of apps/api/src/text-generation/text-generation.controller.ts. The session
check stays in Nest — it owns auth, and it is the only caller.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.routes.llm_errors import llm_error_response
from app.services.text_generation import enhance_prompt, generate_text
from app.validations.text_generation import (
    GenerateTextResult,
    PromptEnhancerResult,
    TextGenerationRequest,
)

router = APIRouter(tags=["text-generation"])


@router.post(
    "/text-generation", response_model=GenerateTextResult, response_model_by_alias=True
)
async def generate(request: TextGenerationRequest):
    try:
        return await generate_text(request.model_id, request.prompt)
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(error, "Failed to generate text", "text-generation")


@router.post(
    "/prompt-enhancer",
    response_model=PromptEnhancerResult,
    response_model_by_alias=True,
)
async def enhance(request: TextGenerationRequest):
    try:
        return await enhance_prompt(request.model_id, request.prompt)
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(error, "Failed to enhance prompt", "text-generation")
