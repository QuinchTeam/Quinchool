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
    # Nest folds everything older than the recent window into this, so a long
    # conversation stays a fixed-size prompt.
    summary: str | None = Field(default=None, max_length=8_000)

    @model_validator(mode="after")
    def latest_message_is_from_user(self) -> ChatbotRequest:
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user")
        return self


class ChatbotAIResult(GenerateTextResult):
    tool_call: ToolCall | None = None


class SummarizeRequest(CamelModel):
    """The messages falling out of the recent window, plus what was already
    summarized, so the running summary is rewritten rather than appended to."""

    messages: list[ChatMessage] = Field(min_length=1, max_length=100)
    model_id: TextGenerationModelId
    previous_summary: str | None = Field(default=None, max_length=8_000)


class SummarizeResult(CamelModel):
    summary: str


class TitleRequest(CamelModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=4)
    model_id: TextGenerationModelId


class TitleResult(CamelModel):
    title: str
