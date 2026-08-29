"""Job scraper request, response, and extraction contracts.

Port of apps/web/src/lib/jobs-scraper/schema.ts. The persistence-facing types
(SavedJob, JobScraperState) stay out: this service never touches the database.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterable
from datetime import date, datetime
from typing import Annotated, ClassVar, Literal
from urllib.parse import urlparse

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)
from pydantic.alias_generators import to_camel

JOB_ROLES = (
    "Software Developer",
    "Full Stack Developer",
    "Software Engineer",
    "Full Stack Engineer",
)

REQUIRED_TECH = (
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Express",
    "NestJS",
    "FastAPI",
    "AI",
    "LLM",
    "PostgreSQL",
    "MySQL",
    "SQL",
)

EXCLUDED_TECH = (
    "C#",
    ".NET",
    "dotnet",
    "Java",
    "OOP",
    "object-oriented programming",
    "NoSQL",
    "MongoDB",
    "DynamoDB",
    "Cassandra",
    "Firestore",
    "Cosmos DB",
    "Neo4j",
    "Redis",
)

JOB_LEVELS = ("Entry", "Junior", "Mid")

EXCLUDED_JOB_LEVELS = (
    "Senior",
    "Sr",
    "Lead",
    "Manager",
    "Staff",
    "Principal",
    "Director",
    "Head",
    "CTO",
)

JOB_SOURCES = ("LinkedIn", "JobStreet")
JOB_WORK_MODES = ("Remote", "Hybrid", "Onsite")
JOB_TIME_RANGES = ("LAST_HOUR", "TODAY", "THIS_WEEK", "CUSTOM")

JOB_URL_PREFIXES = {
    "LinkedIn": "https://www.linkedin.com/jobs/view/",
    "JobStreet": "https://ph.jobstreet.com/job/",
}

JOB_CLASSIFICATIONS = ("MATCH", "POTENTIAL", "REJECTED")

JobSource = Literal["LinkedIn", "JobStreet"]
WorkMode = Literal["Remote", "Hybrid", "Onsite"]
ReviewedWorkMode = Literal["Remote", "Hybrid", "Onsite", "Unclear"]
TimeRange = Literal["LAST_HOUR", "TODAY", "THIS_WEEK", "CUSTOM"]
JobClassification = Literal["MATCH", "POTENTIAL", "REJECTED"]

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
Criterion = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)
]


class CamelModel(BaseModel):
    """Wire format stays camelCase so web, Nest, and this service agree."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        alias_generator=to_camel, populate_by_name=True
    )


def unique_strings(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []

    for value in values:
        key = value.lower()

        if key not in seen:
            seen.add(key)
            result.append(value)

    return result


class JobScraperConfig(CamelModel):
    roles: Annotated[list[Criterion], Field(min_length=1, max_length=30)]
    included_levels: Annotated[list[Criterion], Field(min_length=1, max_length=30)]
    required_technologies: Annotated[list[Criterion], Field(max_length=30)] = []
    excluded_levels: Annotated[list[Criterion], Field(max_length=30)] = []
    excluded_technologies: Annotated[list[Criterion], Field(max_length=30)] = []
    sources: Annotated[list[JobSource], Field(min_length=1)]
    time_range: TimeRange
    custom_start_date: str | None = None
    custom_end_date: str | None = None
    worldwide_work_modes: list[WorkMode] = []
    philippines_work_modes: list[WorkMode] = []

    @field_validator(
        "roles",
        "included_levels",
        "required_technologies",
        "excluded_levels",
        "excluded_technologies",
        "sources",
        "worldwide_work_modes",
        "philippines_work_modes",
        mode="after",
    )
    @classmethod
    def _dedupe(cls, value: list[str]) -> list[str]:
        return unique_strings(value)

    @field_validator("custom_start_date", "custom_end_date", mode="after")
    @classmethod
    def _iso_date(cls, value: str | None) -> str | None:
        if value is not None:
            _ = date.fromisoformat(value)

        return value

    @model_validator(mode="after")
    def _check_range(self) -> JobScraperConfig:
        if not self.worldwide_work_modes and not self.philippines_work_modes:
            raise ValueError("Select at least one location and work mode.")

        if self.time_range != "CUSTOM":
            return self

        if not self.custom_start_date or not self.custom_end_date:
            raise ValueError("Choose both custom range dates.")

        # ponytail: the web app also rejects a custom range outside the latest
        # seven days. That is a config-save rule, not a scan rule — enforcing it
        # here would fail scans for a config that was valid when it was stored.
        # Nest owns it on write; only the ordering matters to build a window.
        if self.custom_start_date > self.custom_end_date:
            raise ValueError("Custom range must start on or before it ends.")

        return self


DEFAULT_JOB_SCRAPER_CONFIG = JobScraperConfig(
    roles=list(JOB_ROLES),
    included_levels=list(JOB_LEVELS),
    required_technologies=list(REQUIRED_TECH),
    excluded_levels=list(EXCLUDED_JOB_LEVELS),
    excluded_technologies=list(EXCLUDED_TECH),
    sources=list(JOB_SOURCES),
    time_range="TODAY",
    custom_start_date=None,
    custom_end_date=None,
    worldwide_work_modes=["Remote"],
    philippines_work_modes=["Remote", "Hybrid"],
)


class JobBase(CamelModel):
    title: Text
    company: Text
    location: Text
    country: Text
    level: Text
    source: JobSource
    url: Text
    posted_at: str | None
    posted_text: Text | None
    summary: Text
    matched_skills: list[Text]

    @field_validator("url", mode="after")
    @classmethod
    def _http_url(cls, value: str) -> str:
        parsed = urlparse(value)

        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("url must be an http(s) URL")

        return value

    @field_validator("posted_at", mode="after")
    @classmethod
    def _offset_datetime(cls, value: str | None) -> str | None:
        """Drops a postedAt the model did not express as an offset timestamp.

        Gemini answers this field with the label it read often enough
        ("21 hours ago") that raising here would fail an entire scan over one
        listing's metadata. The visible label is already kept in postedText and
        the day in postedDate, so an unusable timestamp is worth less than the
        other nineteen jobs in the batch.
        """
        if value is None:
            return None

        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None

        return value if parsed.tzinfo else None


class DiscoveredJob(JobBase):
    work_mode: WorkMode
    posted_date: str

    @field_validator("posted_date", mode="after")
    @classmethod
    def _iso_date(cls, value: str) -> str:
        _ = date.fromisoformat(value)
        return value


class PotentialJob(JobBase):
    work_mode: ReviewedWorkMode
    posted_date: str | None
    review_reasons: Annotated[list[Text], Field(min_length=1)]

    @field_validator("posted_date", mode="after")
    @classmethod
    def _iso_date(cls, value: str | None) -> str | None:
        if value is not None:
            _ = date.fromisoformat(value)

        return value


class JobExtraction(CamelModel):
    """The shape Gemini is asked to return."""

    jobs: list[DiscoveredJob]
    potential_jobs: list[PotentialJob]
    rejected_jobs: list[PotentialJob]


class JobSourceIssue(CamelModel):
    message: str
    source: JobSource


class JobDocument(BaseModel):
    content: str
    source: JobSource
    url: str


class ScanRequest(CamelModel):
    config: JobScraperConfig
    scan_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scanned_at: datetime | None = None


class ScannedJob(CamelModel):
    """One graded listing, flattened into the row Nest stores."""

    classification: JobClassification
    source: JobSource
    source_job_id: str
    url: str
    title: str
    company: str
    location: str
    country: str
    work_mode: ReviewedWorkMode
    level: str
    posted_date: str | None
    posted_at: str | None
    posted_text: str | None
    summary: str
    description: str
    matched_skills: list[str]
    review_reasons: list[str]


class ScanResult(CamelModel):
    scan_id: str
    scanned_at: datetime
    document_count: int
    jobs: list[ScannedJob]
    source_issues: list[JobSourceIssue]


def parse_job_extraction(value: object) -> JobExtraction:
    parsed = JobExtraction.model_validate(value)

    return JobExtraction(
        jobs=[_normalize_job(job) for job in parsed.jobs[:30]],
        potential_jobs=[_normalize_reviewed(job) for job in parsed.potential_jobs[:30]],
        rejected_jobs=[_normalize_reviewed(job) for job in parsed.rejected_jobs[:30]],
    )


def _normalize_job[T: (DiscoveredJob, PotentialJob)](job: T) -> T:
    return job.model_copy(
        update={
            "title": job.title[:300],
            "company": job.company[:300],
            "location": job.location[:300],
            "country": job.country[:120],
            "level": job.level[:120],
            "posted_text": job.posted_text[:240] if job.posted_text else None,
            "summary": job.summary[:1_000],
            "matched_skills": [skill[:120] for skill in job.matched_skills[:12]],
        }
    )


def _normalize_reviewed(job: PotentialJob) -> PotentialJob:
    return _normalize_job(job).model_copy(
        update={
            "review_reasons": [reason[:500] for reason in job.review_reasons[:4]]
        }
    )
