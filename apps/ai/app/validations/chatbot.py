from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator

from app.validations.text_generation import (
    CamelModel,
    GenerateTextResult,
    TextGenerationModelId,
)


class ChatMessage(CamelModel):
    content: str = Field(min_length=1, max_length=8_000)
    role: Literal["user", "assistant"]


class ChatbotRequest(CamelModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=24)
    model_id: TextGenerationModelId

    @model_validator(mode="after")
    def latest_message_is_from_user(self) -> ChatbotRequest:
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user")
        return self


class ProfileChatbotRequest(ChatbotRequest):
    career_profile: dict[str, object] | None


class ChatbotAIResult(GenerateTextResult):
    requires_career_profile: bool
