from typing import final
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock, patch

from app.modules.chatbot.schemas import ChatMessage
from app.modules.chatbot.service import CAREER_PROFILE_TOOL_CALL, respond
from app.modules.resume.schemas import (
    TailorResumeExperience,
    TailorResumeSkillGroup,
    TailorSelection,
    TailorSelectionExperience,
    TailorSelectionSkillGroup,
)
from app.modules.resume.service import reconcile_tailored_resume
from app.modules.text_generation.schemas import GenerateTextResult


@final
class ChatbotTest(IsolatedAsyncioTestCase):
    async def test_requests_the_profile_without_exposing_prompt_logic(self) -> None:
        generation = GenerateTextResult(
            model_id="gemini-3.1-flash-lite",
            provider_id="google-ai-studio",
            provider_model_id="gemini-3.1-flash-lite",
            text=CAREER_PROFILE_TOOL_CALL,
        )

        with patch(
            "app.modules.chatbot.service.generate_text",
            new=AsyncMock(return_value=generation),
        ):
            result = await respond(
                [ChatMessage(role="user", content="Tailor this to my background")],
                "gemini-3.1-flash-lite",
            )

        self.assertTrue(result.requires_career_profile)


@final
class ResumeTest(TestCase):
    def test_drops_invented_bullets_and_keeps_every_skill(self) -> None:
        result = reconcile_tailored_resume(
            [
                TailorResumeExperience(
                    company_name="Example",
                    job_title="Engineer",
                    bullets=["Built APIs", "Improved latency"],
                )
            ],
            [TailorResumeSkillGroup(label="Backend", skills=["Python", "SQL"])],
            TailorSelection(
                experiences=[
                    TailorSelectionExperience(
                        id="exp-0", bullets=["Invented claim", "Built APIs"]
                    )
                ],
                skill_groups=[
                    TailorSelectionSkillGroup(id="skill-0", skills=["SQL"])
                ],
            ),
        )

        self.assertEqual(result.experiences[0].bullets, ["Built APIs"])
        self.assertEqual(result.skill_groups[0].skills, ["SQL", "Python"])
