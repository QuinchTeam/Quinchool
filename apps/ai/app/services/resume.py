from __future__ import annotations

import json

from pydantic import ValidationError

from app.services.text_generation import generate_text
from app.validations.resume import (
    TailoredResume,
    TailoredResumeExperience,
    TailoredResumeSkillGroup,
    TailorResumeExperience,
    TailorResumeRequest,
    TailorResumeSkillGroup,
    TailorSelection,
)

TAILOR_RESUME_SYSTEM_PROMPT = """# Role
You are a resume tailoring specialist. You screen a candidate's existing experience bullets and skills against one specific job requirement and decide which of them earn a place on the resume.

# Objective
Select and rank the experience bullets that genuinely support the given job requirement, and reorder every skill group so the skills that job asks for are read first, so the result can be rendered straight into the candidate's one-page resume.

# Scenario
The candidate is a full-stack engineer whose complete bullet list no longer fits on a one-page resume. Everything they have ever written is stored, grouped by experience and by skill group. For each job they apply to, the bullets must be narrowed to what that specific job asks for. Space is scarce: a bullet that does not support the job requirement pushes out one that does and costs them the screening. Skills are different: they cost one line each, a recruiter scans them left to right, and a skill the candidate really has is never a liability. So skills are reordered, never cut.

# Expected Solution
Reply with a single JSON object and nothing else - no preamble, commentary, explanation, markdown code fences, ranking numbers, or scores:

{
  "experiences": [
    { "id": "exp-0", "bullets": ["<bullet copied verbatim>"] }
  ],
  "skillGroups": [
    { "id": "skill-0", "skills": ["<every skill copied verbatim, reordered>"] }
  ]
}

Include every id listed below exactly once, in the order given. An experience with no relevant bullets gets an empty array; a skill group always gets all of its skills back.

# Steps
1. Read the job requirement and identify the skills, technologies, and responsibilities it asks for.
2. Evaluate each experience separately. Never merge experiences into one ranking.
3. Judge every bullet for relevance, impact, and technical strength.
4. Keep only bullets that support the job requirement, strongest first. Do not pad the list.
5. Return at most 10 bullets per experience.
6. Reorder skill groups without filtering. Return every skill, with direct matches first, adjacent skills next, and everything else in its original order.
7. Copy every selected bullet and skill exactly. Do not reword, shorten, merge, or invent."""


class UnreadableTailorReplyError(Exception):
    pass


async def tailor_resume(request: TailorResumeRequest) -> TailoredResume:
    result = await generate_text(request.model_id, build_tailor_resume_prompt(request))
    parsed = parse_json_object(result.text)

    try:
        selection = TailorSelection.model_validate(parsed)
    except ValidationError as error:
        raise UnreadableTailorReplyError(
            "The model returned an unreadable result. Try again."
        ) from error

    return reconcile_tailored_resume(
        request.experiences, request.skill_groups, selection
    )


def build_tailor_resume_prompt(request: TailorResumeRequest) -> str:
    experience_blocks = "\n\n".join(
        "\n".join(
            [
                f"## exp-{index} - {experience.job_title} at {experience.company_name}",
                *(f"- {bullet}" for bullet in experience.bullets),
            ]
        )
        for index, experience in enumerate(request.experiences)
    )
    skill_blocks = "\n\n".join(
        f"## skill-{index} - {group.label}\n{', '.join(group.skills)}"
        for index, group in enumerate(request.skill_groups)
    )

    return f"""{TAILOR_RESUME_SYSTEM_PROMPT}

# Job Requirement
{request.job_requirement}

# Experiences
{experience_blocks}

# Skill Groups
{skill_blocks}"""


def parse_json_object(text: str) -> object:
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end <= start:
        return None

    try:
        return json.loads(text[start : end + 1])
    except ValueError:
        return None


def reconcile_tailored_resume(
    experiences: list[TailorResumeExperience],
    skill_groups: list[TailorResumeSkillGroup],
    selection: TailorSelection,
) -> TailoredResume:
    bullets_by_id = {entry.id: entry.bullets for entry in selection.experiences}
    skills_by_id = {entry.id: entry.skills for entry in selection.skill_groups}

    return TailoredResume(
        experiences=[
            TailoredResumeExperience(
                company_name=experience.company_name,
                job_title=experience.job_title,
                bullets=order_known(
                    experience.bullets, bullets_by_id.get(f"exp-{index}", [])
                ),
            )
            for index, experience in enumerate(experiences)
        ],
        skill_groups=[
            TailoredResumeSkillGroup(
                label=group.label,
                skills=order_known(
                    group.skills, skills_by_id.get(f"skill-{index}", []), True
                ),
            )
            for index, group in enumerate(skill_groups)
        ],
    )


def order_known(
    available: list[str], chosen: list[str], keep_rest: bool = False
) -> list[str]:
    by_key = {value.strip().casefold(): value for value in available}
    ordered = list(
        dict.fromkeys(
            by_key[key]
            for value in chosen
            if (key := value.strip().casefold()) in by_key
        )
    )

    if not keep_rest:
        return ordered

    return [*ordered, *(value for value in available if value not in ordered)]
