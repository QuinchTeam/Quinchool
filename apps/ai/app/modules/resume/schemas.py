from __future__ import annotations

from typing import Literal

from pydantic import Field

from app.modules.text_generation.schemas import CamelModel, TextGenerationModelId


class TailorResumeExperience(CamelModel):
    company_name: str
    job_title: str
    skills: list[str]
    bullets: list[str]


class TailorResumeProject(CamelModel):
    project_name: str
    skills: list[str]
    bullets: list[str]


class TailorResumeSkillGroup(CamelModel):
    label: str
    skills: list[str]


class TailoredResumeExperience(CamelModel):
    company_name: str
    job_title: str
    bullets: list[str]


class TailoredResumeProject(CamelModel):
    project_name: str
    bullets: list[str]


class TailoredResumeSkillGroup(CamelModel):
    label: str
    skills: list[str]


class TailoredResume(CamelModel):
    experiences: list[TailoredResumeExperience]
    projects: list[TailoredResumeProject]
    skill_groups: list[TailoredResumeSkillGroup]


class TailorResumeRequest(CamelModel):
    model_id: TextGenerationModelId
    job_requirement: str = Field(min_length=1)
    experiences: list[TailorResumeExperience]
    projects: list[TailorResumeProject]
    skill_groups: list[TailorResumeSkillGroup]
    education_count: int = Field(default=0, ge=0)
    fit: Literal["expand", "reduce"] | None = None
    rendered_page_count: int | None = Field(default=None, ge=1)
    rendered_fill_ratio: float | None = Field(default=None, ge=0, le=2)
    previous_resume: TailoredResume | None = None


class TailoredBulletDraft(CamelModel):
    text: str = Field(min_length=1, max_length=2_000)
    source_indices: list[int] = Field(min_length=1, max_length=4)


class TailorSelectionExperience(CamelModel):
    id: str
    bullets: list[TailoredBulletDraft] = Field(default_factory=list)


class TailorSelectionProject(CamelModel):
    id: str
    bullets: list[TailoredBulletDraft] = Field(default_factory=list)


class TailorSelectionSkillGroup(CamelModel):
    id: str
    skills: list[str] = Field(default_factory=list)


class TailorSelection(CamelModel):
    experiences: list[TailorSelectionExperience] = Field(default_factory=list)
    projects: list[TailorSelectionProject] = Field(default_factory=list)
    skill_groups: list[TailorSelectionSkillGroup] = Field(default_factory=list)
