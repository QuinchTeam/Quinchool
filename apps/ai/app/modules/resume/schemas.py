from __future__ import annotations

from pydantic import Field

from app.modules.text_generation.schemas import CamelModel, TextGenerationModelId


class TailorResumeExperience(CamelModel):
    company_name: str
    job_title: str
    bullets: list[str]


class TailorResumeSkillGroup(CamelModel):
    label: str
    skills: list[str]


class TailorResumeRequest(CamelModel):
    model_id: TextGenerationModelId
    job_requirement: str = Field(min_length=1)
    experiences: list[TailorResumeExperience]
    skill_groups: list[TailorResumeSkillGroup]


class TailorSelectionExperience(CamelModel):
    id: str
    bullets: list[str] = Field(default_factory=list)


class TailorSelectionSkillGroup(CamelModel):
    id: str
    skills: list[str] = Field(default_factory=list)


class TailorSelection(CamelModel):
    experiences: list[TailorSelectionExperience] = Field(default_factory=list)
    skill_groups: list[TailorSelectionSkillGroup] = Field(default_factory=list)


class TailoredResumeExperience(CamelModel):
    company_name: str
    job_title: str
    bullets: list[str]


class TailoredResumeSkillGroup(CamelModel):
    label: str
    skills: list[str]


class TailoredResume(CamelModel):
    experiences: list[TailoredResumeExperience]
    skill_groups: list[TailoredResumeSkillGroup]
