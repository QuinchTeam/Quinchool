from __future__ import annotations

import re
from collections.abc import Sequence
from datetime import date, datetime, timedelta, timezone
from urllib.parse import urlparse

from app.validations.jobs_scraper import (
    JOB_URL_PREFIXES,
    DiscoveredJob,
    JobScraperConfig,
    JobSource,
    PotentialJob,
    WorkMode,
)

MANILA = timezone(timedelta(hours=8), "Asia/Manila")


def get_job_rejection_reasons(
    job: DiscoveredJob | PotentialJob,
    config: JobScraperConfig,
    now: datetime,
) -> list[str]:
    """Return every configured criterion that disqualifies a job."""
    is_lenient = isinstance(job, PotentialJob)
    searchable_text = " ".join([job.title, job.summary, *job.matched_skills])
    level_text = f"{job.title} {job.level}"
    excluded_level = find_matching_criterion(level_text, config.excluded_levels)
    excluded_tech = find_matching_criterion(
        searchable_text, config.excluded_technologies
    )
    reasons: list[str] = []

    if get_job_source_from_url(job.url) != job.source or not job.url.startswith(
        JOB_URL_PREFIXES[job.source]
    ):
        reasons.append(f"The URL is not a {job.source} job listing.")

    if job.source not in config.sources:
        reasons.append(f"{job.source} is not one of your enabled sources.")

    if job.posted_date is None:
        if not is_lenient:
            reasons.append("The posting date could not be established.")
    elif not is_date_in_range(job.posted_date, job.posted_at, config, now):
        from_date, to_date = get_job_date_window(config, now)
        reasons.append(
            "It was not posted within the last hour."
            if config.time_range == "LAST_HOUR"
            else f"Posted {job.posted_date}, outside your {from_date} to {to_date} window."
        )

    if job.work_mode == "Unclear":
        if not is_lenient:
            reasons.append("The work mode could not be established.")
    elif not is_location_allowed(job.country, job.work_mode, config):
        reasons.append(
            f"{job.work_mode} work in {job.country} is not an allowed location and work mode."
        )

    if not matches_any_criterion(job.title, config.roles):
        reasons.append(f'"{job.title}" does not match a configured role.')

    if not matches_any_criterion(job.level, config.included_levels):
        reasons.append(f'Level "{job.level}" is not an included level.')

    if excluded_level and not matches_any_criterion(level_text, config.included_levels):
        reasons.append(
            f'The title or level matches the excluded level "{excluded_level}".'
        )

    if (
        not is_lenient
        and config.required_technologies
        and not matches_any_criterion(searchable_text, config.required_technologies)
    ):
        reasons.append("None of your required technologies were mentioned.")

    if excluded_tech:
        reasons.append(f'It mentions the excluded technology "{excluded_tech}".')

    return reasons


def find_matching_criterion(text: str, criteria: Sequence[str]) -> str | None:
    return next(
        (
            criterion
            for criterion in criteria
            if text_matches_criterion(text, criterion)
        ),
        None,
    )


def matches_any_criterion(text: str, criteria: Sequence[str]) -> bool:
    return any(text_matches_criterion(text, criterion) for criterion in criteria)


def text_matches_criterion(text: str, criterion: str) -> bool:
    trimmed = criterion.strip()

    if not trimmed:
        return False

    escaped = r"\s+".join(re.escape(part) for part in trimmed.split())
    prefix = r"\b" if re.match(r"[A-Za-z0-9_]", trimmed[0]) else ""
    suffix = r"\b" if re.match(r"[A-Za-z0-9_]", trimmed[-1]) else ""

    return re.search(prefix + escaped + suffix, text, re.IGNORECASE) is not None


def is_location_allowed(
    country: str, work_mode: WorkMode, config: JobScraperConfig
) -> bool:
    return work_mode in config.worldwide_work_modes or (
        _is_philippines(country) and work_mode in config.philippines_work_modes
    )


def is_date_in_range(
    posted_date: str,
    posted_at: str | None,
    config: JobScraperConfig,
    now: datetime,
) -> bool:
    if config.time_range == "LAST_HOUR":
        if not posted_at:
            return False

        timestamp = datetime.fromisoformat(posted_at)
        return now - timedelta(hours=1) <= timestamp <= now

    from_date, to_date = get_job_date_window(config, now)
    return from_date <= posted_date <= to_date


def get_job_date_window(config: JobScraperConfig, now: datetime) -> tuple[str, str]:
    today = get_today_in_manila(now)

    if (
        config.time_range == "CUSTOM"
        and config.custom_start_date
        and config.custom_end_date
    ):
        return config.custom_start_date, config.custom_end_date

    from_date = _shift_date(today, -6) if config.time_range == "THIS_WEEK" else today
    return from_date, today


def get_crawl_lookback_seconds(config: JobScraperConfig) -> int:
    if config.time_range == "LAST_HOUR":
        return 3_600

    if config.time_range == "TODAY":
        return 86_400

    return 604_800


def get_today_in_manila(now: datetime) -> str:
    return now.astimezone(MANILA).date().isoformat()


def get_job_source_from_url(url: str) -> JobSource | None:
    hostname = (urlparse(url).hostname or "").lower()

    if hostname == "linkedin.com" or hostname.endswith(".linkedin.com"):
        return "LinkedIn"

    if hostname == "jobstreet.com" or hostname.endswith(".jobstreet.com"):
        return "JobStreet"

    return None


def get_source_job_id(url: str, source: JobSource) -> str:
    pathname = urlparse(url).path.rstrip("/")
    match = (
        re.search(r"/job/(\d+)", pathname)
        if source == "JobStreet"
        else re.search(r"(?:/|-)(\d+)$", pathname)
    )

    return match.group(1) if match else pathname.lower()


def _shift_date(value: str, days: int) -> str:
    return (date.fromisoformat(value) + timedelta(days=days)).isoformat()


def _is_philippines(country: str) -> bool:
    return re.fullmatch(r"philippines|ph", country.strip(), re.IGNORECASE) is not None
