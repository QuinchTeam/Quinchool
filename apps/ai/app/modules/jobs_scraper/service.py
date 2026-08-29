"""Crawl, extract with Gemini, then grade. No persistence lives here.

Port of apps/web/src/lib/jobs-scraper/service.ts with every storage call
removed: the caller (Nest) owns the config it passes in and the rows it writes
out of the result.
"""

from __future__ import annotations

import time
from datetime import datetime

from app.core.config import get_settings
from app.core.logging import elapsed_ms, log_jobs_scraper
from app.lib.jobs_scraper.rules import (
    get_job_date_window,
    get_job_rejection_reasons,
    get_job_source_from_url,
    get_source_job_id,
)
from app.lib.llm.gemini import extract_jobs
from app.lib.scraping.crawl4ai import collect_job_documents
from app.modules.jobs_scraper.schemas import (
    DiscoveredJob,
    JobClassification,
    JobDocument,
    JobExtraction,
    JobScraperConfig,
    JobSourceIssue,
    PotentialJob,
    ScannedJob,
    ScanResult,
)


async def scan_jobs(
    scan_id: str, config: JobScraperConfig, scanned_at: datetime
) -> ScanResult:
    scan_started_at = time.monotonic()
    from_date, to_date = get_job_date_window(config, scanned_at)

    log_jobs_scraper(
        "info",
        "scan.started",
        scan_id,
        {
            "dateWindow": {"fromDate": from_date, "toDate": to_date},
            "roles": config.roles,
            "sources": config.sources,
            "timeRange": config.time_range,
            "workModes": {
                "philippines": config.philippines_work_modes,
                "worldwide": config.worldwide_work_modes,
            },
        },
    )

    documents, source_issues = await collect_job_documents(scan_id, config)

    log_jobs_scraper(
        "info",
        "documents.collected",
        scan_id,
        {
            "documents": [
                {"source": document.source, "url": document.url}
                for document in documents
            ],
            "documentCount": len(documents),
        },
    )

    if not documents:
        log_jobs_scraper("info", "gemini.skipped", scan_id, {"reason": "no_documents"})
        return _complete(
            scan_id, scanned_at, scan_started_at, [], source_issues, documents
        )

    settings = get_settings()
    gemini_started_at = time.monotonic()
    result = await extract_jobs(scanned_at, config, documents)

    log_jobs_scraper(
        "info",
        "gemini.classification.completed",
        scan_id,
        {
            "durationMs": elapsed_ms(gemini_started_at),
            "matchCandidates": [_to_logged_job(job) for job in result.jobs],
            "model": settings.gemini_model,
            "potentialCandidates": [
                _to_logged_job(job) for job in result.potential_jobs
            ],
            "rejectedCandidates": [_to_logged_job(job) for job in result.rejected_jobs],
        },
    )

    descriptions = {
        document.url.lower(): document.content for document in documents
    }
    classified = [
        _to_scanned_job(entry, descriptions)
        for entry in classify_scanned_jobs(result, config, scanned_at)
    ]

    log_jobs_scraper(
        "info",
        "selection.completed",
        scan_id,
        {
            "jobs": [
                {
                    "classification": job.classification,
                    "reviewReasons": job.review_reasons,
                    "source": job.source,
                    "sourceJobId": job.source_job_id,
                    "title": job.title,
                    "url": job.url,
                }
                for job in classified
            ]
        },
    )

    return _complete(
        scan_id, scanned_at, scan_started_at, classified, source_issues, documents
    )


def classify_scanned_jobs(
    result: JobExtraction,
    config: JobScraperConfig,
    scanned_at: datetime,
) -> list[tuple[JobClassification, DiscoveredJob | PotentialJob, list[str]]]:
    """Grades every extracted listing against the configured criteria and
    settles it into one bucket. A listing Gemini proposed as a match or a
    potential match is demoted to REJECTED when the deterministic criteria
    disagree, and it carries the reasons for that verdict so the scan stays
    reviewable.
    """
    candidates: list[tuple[DiscoveredJob | PotentialJob, JobClassification]] = [
        *((job, "MATCH") for job in result.jobs),
        *((job, "POTENTIAL") for job in result.potential_jobs),
        *((job, "REJECTED") for job in result.rejected_jobs),
    ]
    seen: set[str] = set()
    classified: list[
        tuple[JobClassification, DiscoveredJob | PotentialJob, list[str]]
    ] = []

    for job, proposed in candidates:
        dedupe_key = job.url.lower()

        if dedupe_key in seen:
            continue

        seen.add(dedupe_key)
        failures = get_job_rejection_reasons(job, config, scanned_at)
        classification: JobClassification = (
            "REJECTED" if proposed == "REJECTED" or failures else proposed
        )
        model_reasons = (
            job.review_reasons if isinstance(job, PotentialJob) else []
        )
        reasons = list(dict.fromkeys([*model_reasons, *failures]))[:6]
        classified.append((classification, job, reasons))

    return classified


def _to_scanned_job(
    entry: tuple[JobClassification, DiscoveredJob | PotentialJob, list[str]],
    descriptions: dict[str, str],
) -> ScannedJob:
    classification, job, review_reasons = entry
    # A listing rejected for a bad URL can name a source its URL does not
    # belong to; fall back to the model's own source so the id stays derivable.
    source = get_job_source_from_url(job.url) or job.source

    return ScannedJob(
        classification=classification,
        source=source,
        source_job_id=get_source_job_id(job.url, source),
        url=job.url,
        title=job.title,
        company=job.company,
        location=job.location,
        country=job.country,
        work_mode=job.work_mode,
        level=job.level,
        posted_date=job.posted_date,
        posted_at=job.posted_at,
        posted_text=job.posted_text,
        summary=job.summary,
        description=descriptions.get(job.url.lower(), ""),
        matched_skills=job.matched_skills,
        review_reasons=review_reasons,
    )


def _complete(
    scan_id: str,
    scanned_at: datetime,
    scan_started_at: float,
    jobs: list[ScannedJob],
    source_issues: list[JobSourceIssue],
    documents: list[JobDocument],
) -> ScanResult:
    counts: dict[str, int] = {"MATCH": 0, "POTENTIAL": 0, "REJECTED": 0}

    for job in jobs:
        counts[job.classification] += 1

    log_jobs_scraper(
        "warn" if source_issues else "info",
        "scan.completed",
        scan_id,
        {
            "classificationCounts": counts,
            "documentCount": len(documents),
            "durationMs": elapsed_ms(scan_started_at),
            "sourceIssues": [
                issue.model_dump(by_alias=True) for issue in source_issues
            ],
        },
    )

    return ScanResult(
        scan_id=scan_id,
        scanned_at=scanned_at,
        document_count=len(documents),
        jobs=jobs,
        source_issues=source_issues,
    )


def _to_logged_job(job: DiscoveredJob | PotentialJob) -> dict[str, object]:
    logged: dict[str, object] = {
        "company": job.company,
        "country": job.country,
        "level": job.level,
        "location": job.location,
        "matchedSkills": job.matched_skills,
        "postedAt": job.posted_at,
        "postedDate": job.posted_date,
        "source": job.source,
        "title": job.title,
        "url": job.url,
        "workMode": job.work_mode,
    }

    if isinstance(job, PotentialJob):
        logged["reviewReasons"] = job.review_reasons

    return logged

