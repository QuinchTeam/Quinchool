from fastapi import APIRouter

from app.modules.chatbot.schemas import (
    ChatbotAIResult,
    ChatbotRequest,
    SummarizeRequest,
    SummarizeResult,
    TitleRequest,
    TitleResult,
)
from app.modules.chatbot.service import generate_title, respond, summarize
from app.modules.text_generation.error_response import llm_error_response

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post(
    "/respond", response_model=ChatbotAIResult, response_model_by_alias=True
)
async def chatbot_respond(request: ChatbotRequest):
    try:
        return await respond(
            request.messages,
            request.model_id,
            request.tool_results,
            request.summary,
        )
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(
            error, "The assistant could not respond. Try again.", "chatbot"
        )


@router.post(
    "/summarize", response_model=SummarizeResult, response_model_by_alias=True
)
async def chatbot_summarize(request: SummarizeRequest):
    try:
        return SummarizeResult(
            summary=await summarize(
                request.messages, request.model_id, request.previous_summary
            )
        )
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(
            error, "The conversation could not be summarized.", "chatbot"
        )


@router.post("/title", response_model=TitleResult, response_model_by_alias=True)
async def chatbot_title(request: TitleRequest):
    try:
        return TitleResult(
            title=await generate_title(request.messages, request.model_id)
        )
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(
            error, "The chat could not be titled.", "chatbot"
        )
