from fastapi import APIRouter

from app.modules.chatbot.schemas import ChatbotAIResult, ChatbotRequest
from app.modules.chatbot.service import respond
from app.modules.text_generation.error_response import llm_error_response

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post(
    "/respond", response_model=ChatbotAIResult, response_model_by_alias=True
)
async def chatbot_respond(request: ChatbotRequest):
    try:
        return await respond(request.messages, request.model_id, request.tool_results)
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(
            error, "The assistant could not respond. Try again.", "chatbot"
        )
