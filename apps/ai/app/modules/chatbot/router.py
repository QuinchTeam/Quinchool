from fastapi import APIRouter

from app.modules.chatbot.schemas import (
    ChatbotAIResult,
    ChatbotRequest,
    ProfileChatbotRequest,
)
from app.modules.chatbot.service import respond, respond_with_profile
from app.modules.text_generation.error_response import llm_error_response

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post(
    "/respond", response_model=ChatbotAIResult, response_model_by_alias=True
)
async def chatbot_respond(request: ChatbotRequest):
    try:
        return await respond(request.messages, request.model_id)
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(
            error, "The assistant could not respond. Try again.", "chatbot"
        )


@router.post(
    "/respond-with-profile",
    response_model=ChatbotAIResult,
    response_model_by_alias=True,
)
async def chatbot_respond_with_profile(request: ProfileChatbotRequest):
    try:
        return await respond_with_profile(
            request.messages, request.model_id, request.career_profile
        )
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(
            error, "The assistant could not respond. Try again.", "chatbot"
        )
