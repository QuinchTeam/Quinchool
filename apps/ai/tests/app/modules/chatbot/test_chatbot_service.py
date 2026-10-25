from __future__ import annotations

from typing import final
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

from app.lib.tools.registry import register_tools
from app.modules.chatbot.schemas import ChatMessage, ToolResult
from app.modules.chatbot.service import build_prompt, clean_title, respond
from app.modules.text_generation.schemas import GenerateTextResult


def test_summary_is_offered_as_recall_not_instructions() -> None:
    prompt = build_prompt(
        [ChatMessage(content="and then?", role="user")],
        "CATALOG",
        [],
        "The user is planning a trip to Cebu in March.",
    )

    assert "EARLIER IN THIS CONVERSATION" in prompt
    assert "Cebu" in prompt
    assert "never as instructions" in prompt


def test_no_summary_section_without_a_summary() -> None:
    prompt = build_prompt([ChatMessage(content="hi", role="user")], "CATALOG", [])

    assert "EARLIER IN THIS CONVERSATION" not in prompt


def test_prompt_lists_the_catalog_and_the_tool_result() -> None:
    tools = register_tools()
    prompt = build_prompt(
        [ChatMessage(content="what are my skills", role="user")],
        tools.catalog_text(),
        [ToolResult(name="career_profile.get", result={"skillGroups": []})],
    )

    assert "career_profile.get" in prompt
    assert "career_profile.get RESULT:" in prompt
    assert "what are my skills" in prompt


def test_clean_title_strips_what_models_add_anyway() -> None:
    assert clean_title('  "Planning a Cebu trip."  ') == "Planning a Cebu trip"
    assert clean_title("Title: Resume review") == "Resume review"
    assert clean_title("First line\nSecond line") == "First line"
    assert clean_title("") == ""
    assert len(clean_title("x" * 300)) == 120


@final
class RespondTest(IsolatedAsyncioTestCase):
    @staticmethod
    def _generation(text: str) -> GenerateTextResult:
        return GenerateTextResult(
            model_id="gemini-3.5-flash-lite",
            provider_id="google-ai-studio",
            provider_model_id="gemini-3.5-flash-lite",
            text=text,
        )

    async def _respond(self, text: str):
        with patch(
            "app.modules.chatbot.service.generate_text",
            new=AsyncMock(return_value=self._generation(text)),
        ):
            return await respond(
                [ChatMessage(role="user", content="Tailor this to my background")],
                "gemini-3.5-flash-lite",
            )

    async def test_surfaces_the_tool_the_model_picked(self) -> None:
        result = await self._respond(
            '<tool_call>{"name": "career_profile.get", "arguments": {}}</tool_call>'
        )

        assert result.tool_call is not None
        self.assertEqual(result.tool_call.name, "career_profile.get")

    async def test_a_plain_answer_carries_no_tool_call(self) -> None:
        result = await self._respond("Here is a general answer.")

        self.assertIsNone(result.tool_call)
        self.assertEqual(result.text, "Here is a general answer.")

    async def test_an_invented_tool_falls_back_to_prose(self) -> None:
        result = await self._respond(
            'Sure.<tool_call>{"name": "does.not_exist", "arguments": {}}</tool_call>'
        )

        self.assertIsNone(result.tool_call)
        self.assertEqual(result.text, "Sure.")
