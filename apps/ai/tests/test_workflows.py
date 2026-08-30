import json
from typing import final
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock, patch

from app.modules.chatbot.schemas import ChatMessage
from app.modules.chatbot.service import CAREER_PROFILE_TOOL_CALL, respond
from app.modules.resume.schemas import (
    TailoredBulletDraft,
    TailoredResume,
    TailoredResumeExperience,
    TailorResumeExperience,
    TailorResumeProject,
    TailorResumeRequest,
    TailorResumeSkillGroup,
    TailorSelection,
    TailorSelectionExperience,
    TailorSelectionProject,
    TailorSelectionSkillGroup,
)
from app.modules.resume.service import (
    MAX_BULLET_CHARACTERS,
    MAX_SKILL_LINE_CHARACTERS,
    MIN_BULLET_CHARACTERS,
    RESUME_BULLET_COUNT,
    UnreadableTailorReplyError,
    reconcile_tailored_resume,
    resume_constraint_violations,
    tailor_resume,
)
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
    def test_keeps_only_grounded_rewrites_and_known_skills(self) -> None:
        result = reconcile_tailored_resume(
            [
                TailorResumeExperience(
                    company_name="Example",
                    job_title="Engineer",
                    skills=["Python"],
                    bullets=["Built APIs", "Improved latency"],
                )
            ],
            [
                TailorResumeProject(
                    project_name="Example project",
                    skills=["Python"],
                    bullets=["Served 20 users"],
                )
            ],
            [TailorResumeSkillGroup(label="Backend", skills=["Python", "SQL"])],
            TailorSelection(
                experiences=[
                    TailorSelectionExperience(
                        id="exp-0",
                        bullets=[
                            TailoredBulletDraft(
                                text="Built production APIs", source_indices=[0]
                            ),
                            TailoredBulletDraft(
                                text="Improved latency by 50%", source_indices=[1]
                            ),
                            TailoredBulletDraft(
                                text="Invented claim", source_indices=[9]
                            ),
                        ],
                    )
                ],
                projects=[
                    TailorSelectionProject(
                        id="project-0",
                        bullets=[
                            TailoredBulletDraft(
                                text="Served 20 users", source_indices=[0]
                            )
                        ],
                    )
                ],
                skill_groups=[TailorSelectionSkillGroup(id="skill-0", skills=["SQL"])],
            ),
        )

        self.assertEqual(result.experiences[0].bullets, ["Built production APIs"])
        self.assertEqual(result.projects[0].bullets, ["Served 20 users"])
        self.assertEqual(result.skill_groups[0].skills, ["SQL", "Python"])

    def test_reports_bullet_count_and_character_violations(self) -> None:
        resume = TailoredResume(
            experiences=[
                TailoredResumeExperience(
                    company_name="Example",
                    job_title="Engineer",
                    bullets=["Too short", "x" * (MAX_BULLET_CHARACTERS + 1)],
                )
            ],
            projects=[],
            skill_groups=[],
        )

        violations = resume_constraint_violations(resume)

        self.assertEqual(len(violations), 3)
        self.assertIn("needs exactly 14", violations[0])
        self.assertIn("has 9 characters", violations[1])
        self.assertIn("has 171 characters", violations[2])

    def test_accepts_target_count_at_character_boundaries(self) -> None:
        resume = TailoredResume(
            experiences=[
                TailoredResumeExperience(
                    company_name="Example",
                    job_title="Engineer",
                    bullets=[
                        *("x" * MIN_BULLET_CHARACTERS for _ in range(7)),
                        *("y" * MAX_BULLET_CHARACTERS for _ in range(7)),
                    ],
                )
            ],
            projects=[],
            skill_groups=[],
        )

        self.assertEqual(resume_constraint_violations(resume), [])

    def test_fills_skill_rows_with_known_skills_without_exceeding_budget(
        self,
    ) -> None:
        result = reconcile_tailored_resume(
            [],
            [],
            [
                TailorResumeSkillGroup(
                    label="Backend",
                    skills=["Python", "SQL", "Redis", "x" * 100, "Docker"],
                )
            ],
            TailorSelection(
                skill_groups=[TailorSelectionSkillGroup(id="skill-0", skills=["SQL"])]
            ),
        )

        skills = result.skill_groups[0].skills
        self.assertEqual(skills, ["SQL", "Python", "Redis", "Docker"])
        self.assertLessEqual(
            len(f"Backend: {', '.join(skills)}"), MAX_SKILL_LINE_CHARACTERS
        )


@final
class ResumeTailoringTest(IsolatedAsyncioTestCase):
    async def test_repairs_short_and_missing_bullets_with_ai(self) -> None:
        request = TailorResumeRequest(
            model_id="gemini-3.1-flash-lite",
            job_requirement="Build reliable APIs",
            experiences=[
                TailorResumeExperience(
                    company_name="Example",
                    job_title="Engineer",
                    skills=["Python"],
                    bullets=["Built and maintained reliable production APIs."],
                )
            ],
            projects=[],
            skill_groups=[],
        )
        short_draft = {
            "experiences": [
                {
                    "id": "exp-0",
                    "bullets": [
                        {"text": "Built APIs", "sourceIndices": [0]},
                    ],
                }
            ],
            "projects": [],
            "skillGroups": [],
        }
        labels = [
            "alpha",
            "bravo",
            "charlie",
            "delta",
            "echo",
            "foxtrot",
            "golf",
            "hotel",
            "india",
            "juliet",
            "kilo",
            "lima",
            "mike",
            "november",
        ]
        valid_bullets = [
            (
                "Built and maintained reliable production APIs, improving service "
                f"clarity and operational consistency across the {label} workflow."
            )
            for label in labels
        ]
        repaired_draft = {
            "experiences": [
                {
                    "id": "exp-0",
                    "bullets": [
                        {"text": bullet, "sourceIndices": [0]}
                        for bullet in valid_bullets
                    ],
                }
            ],
            "projects": [],
            "skillGroups": [],
        }
        generations = [
            self.generation(short_draft),
            self.generation(repaired_draft),
        ]

        with patch(
            "app.modules.resume.service.generate_text",
            new=AsyncMock(side_effect=generations),
        ) as generate:
            result = await tailor_resume(request)

        bullets = result.experiences[0].bullets
        self.assertEqual(generate.await_count, 2)
        self.assertEqual(len(bullets), RESUME_BULLET_COUNT)
        self.assertTrue(
            all(
                MIN_BULLET_CHARACTERS <= len(bullet) <= MAX_BULLET_CHARACTERS
                for bullet in bullets
            )
        )
        repair_prompt = generate.await_args_list[1].args[1]
        initial_prompt = generate.await_args_list[0].args[1]
        self.assertIn("Return exactly 14 generated bullets", initial_prompt)
        self.assertIn("7 per experience", initial_prompt)
        self.assertIn("Mandatory Repair", repair_prompt)
        self.assertIn("has 1 bullets; it needs exactly 14", repair_prompt)

    async def test_fails_closed_when_ai_cannot_repair_bullets(self) -> None:
        request = TailorResumeRequest(
            model_id="gemini-3.1-flash-lite",
            job_requirement="Build reliable APIs",
            experiences=[
                TailorResumeExperience(
                    company_name="Example",
                    job_title="Engineer",
                    skills=["Python"],
                    bullets=["Built and maintained reliable production APIs."],
                )
            ],
            projects=[],
            skill_groups=[],
        )
        short_draft = {
            "experiences": [
                {
                    "id": "exp-0",
                    "bullets": [
                        {"text": "Built APIs", "sourceIndices": [0]},
                    ],
                }
            ],
            "projects": [],
            "skillGroups": [],
        }
        generate = AsyncMock(return_value=self.generation(short_draft))

        with (
            patch("app.modules.resume.service.generate_text", new=generate),
            self.assertRaises(UnreadableTailorReplyError),
        ):
            await tailor_resume(request)

        self.assertEqual(generate.await_count, 3)

    @staticmethod
    def generation(payload: object) -> GenerateTextResult:
        return GenerateTextResult(
            model_id="gemini-3.1-flash-lite",
            provider_id="google-ai-studio",
            provider_model_id="gemini-3.1-flash-lite",
            text=json.dumps(payload),
        )
