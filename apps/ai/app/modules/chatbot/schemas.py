from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator

from app.modules.text_generation.schemas import (
    CamelModel,
    GenerateTextResult,
    TextGenerationModelId,
)


class ChatMessage(CamelModel):
    content: str = Field(min_length=1, max_length=8_000)
    role: Literal["user", "assistant"]


class ToolCall(CamelModel):
    """The tool the model picked, and what it wants passed to it."""

    name: str
    arguments: dict[str, object] = Field(default_factory=dict)


class ToolResult(CamelModel):
    """What Nest got back from running a tool, fed into the next pass."""

    name: str
    result: object = None


class ChatbotRequest(CamelModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=24)
    model_id: TextGenerationModelId
    tool_results: list[ToolResult] = Field(default_factory=list, max_length=8)

    @model_validator(mode="after")
    def latest_message_is_from_user(self) -> ChatbotRequest:
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user")
        return self


class ChatbotAIResult(GenerateTextResult):
    tool_call: ToolCall | None = None
