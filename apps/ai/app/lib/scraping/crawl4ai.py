"""Crawl4AI client: search pages in, readable job documents out.

Port of apps/web/src/lib/jobs-scraper/crawler.ts.
"""

from __future__ import annotations

import re
import time
from collections.abc import Sequence
from typing import ClassVar
from urllib.parse import quote, urlparse, urlunparse

import httpx
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import get_settings
from app.core.exceptions import Crawl4AiUnavailableError
from app.core.logging import elapsed_ms, log_jobs_scraper
from app.lib.jobs_scraper.rules import (
    get_crawl_lookback_seconds,
    get_job_source_from_url,
)
from app.modules.jobs_scraper.schemas import (
    JOB_SOURCES,
    JOB_URL_PREFIXES,
    JobDocument,
    JobScraperConfig,
    JobSource,
    JobSourceIssue,
    WorkMode,
)

MAX_JOBS_PER_SOURCE = 10
# Job pages put the tech stack well below the summary, and 12k characters was
# cutting it off — listings were rejected for "no required technology" when the
# stack sat just past the limit. Raising this costs Gemini tokens per scan;
# lower it if quota becomes the binding constraint.
MAX_DOCUMENT_LENGTH = 30_000
CRAWL_TIMEOUT_SECONDS = 180.0

BLOCKED_PATTERN = re.compile(
    r"additional verification required|just a moment|access denied|captcha",
    re.IGNORECASE,
)
LINKEDIN_PATH = re.compile(r"^/jobs/view/")
JOBSTREET_PATH = re.compile(r"^/job/\d+")


class CrawlLink(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(extra="allow")

    href: str


class CrawlLinks(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(extra="allow")

    external: list[CrawlLink] = []
    internal: list[CrawlLink] = []


class CrawlResult(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(extra="allow")

    error_message: str | None = None
    links: CrawlLinks = Field(default_factory=CrawlLinks)
    markdown: str | dict[str, object] | None = None
    status_code: int | None = None
    success: bool
    url: str


class CrawlResponse(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(extra="allow")

    results: list[CrawlResult]
    success: bool


async def collect_job_documents(
    scan_id: str, config: JobScraperConfig
) -> tuple[list[JobDocument], list[JobSourceIssue]]:
    search_urls = build_search_urls(config)
    search_started_at = time.monotonic()
    search_results = await crawl_urls(search_urls)

    log_jobs_scraper(
        "info",
        "crawl.search.completed",
        scan_id,
        {
            "durationMs": elapsed_ms(search_started_at),
            "sources": _summarize_crawl_batch(search_urls, search_results),
        },
    )

    source_issues: list[JobSourceIssue] = []
    detail_urls: dict[JobSource, list[str]] = {}

    for source in config.sources:
        source_search_results = [
            result
            for result in search_results
            if get_job_source_from_url(result.url) == source
        ]
        urls = extract_job_urls(source_search_results, source)[:MAX_JOBS_PER_SOURCE]
        detail_urls[source] = urls

        if not urls:
            source_issues.append(
                JobSourceIssue(
                    source=source,
                    message=(
                        "The source blocked automated access."
                        if any(is_blocked(result) for result in source_search_results)
                        else "No current job links were available."
                    ),
                )
            )

    log_jobs_scraper(
        "info",
        "crawl.links.selected",
        scan_id,
        {
            "sources": {
                source: {"count": len(urls), "urls": urls}
                for source, urls in detail_urls.items()
            }
        },
    )

    selected_detail_urls = [url for urls in detail_urls.values() for url in urls]
    details_started_at = time.monotonic()
    detail_results = await crawl_urls(selected_detail_urls)
    documents: list[JobDocument] = []

    for result in detail_results:
        source = get_job_source_from_url(result.url)
        content = read_markdown(result)

        if not source or not result.success or is_blocked(result) or not content:
            continue

        documents.append(
            JobDocument(
                content=content[:MAX_DOCUMENT_LENGTH],
                source=source,
                url=normalize_job_url(result.url, source),
            )
        )

    for source in config.sources:
        if detail_urls.get(source) and not any(
            document.source == source for document in documents
        ):
            source_issues.append(
                JobSourceIssue(
                    source=source,
                    message="Job links were found, but their details could not be read.",
                )
            )

    log_jobs_scraper(
        "warn" if source_issues else "info",
        "crawl.details.completed",
        scan_id,
        {
            "durationMs": elapsed_ms(details_started_at),
            "issues": [issue.model_dump(by_alias=True) for issue in source_issues],
            "sources": {
                source: {
                    **_summarize_source_crawl(
                        source, selected_detail_urls, detail_results
                    ),
                    "documents": [
                        document.url
                        for document in documents
                        if document.source == source
                    ],
                }
                for source in JOB_SOURCES
            },
        },
    )

    return documents, source_issues


def build_search_urls(config: JobScraperConfig) -> list[str]:
    lookback_seconds = get_crawl_lookback_seconds(config)
    jobstreet_days = 1 if lookback_seconds <= 86_400 else 7
    urls: list[str] = []

    for role in config.roles:
        encoded_role = quote(role, safe="")
        slug = role.lower().replace(" ", "-")

        if "LinkedIn" in config.sources:
            if config.philippines_work_modes:
                urls.append(
                    _build_linkedin_search_url(
                        encoded_role,
                        "Philippines",
                        config.philippines_work_modes,
                        lookback_seconds,
                    )
                )

            if config.worldwide_work_modes:
                urls.append(
                    _build_linkedin_search_url(
                        encoded_role,
                        "Worldwide",
                        config.worldwide_work_modes,
                        lookback_seconds,
                    )
                )

        if "JobStreet" in config.sources:
            urls.append(
                f"https://ph.jobstreet.com/{slug}-jobs?daterange={jobstreet_days}"
            )

    return urls


def _build_linkedin_search_url(
    encoded_role: str,
    location: str,
    work_modes: Sequence[WorkMode],
    lookback_seconds: int,
) -> str:
    work_mode_ids = {"Hybrid": "3", "Onsite": "1", "Remote": "2"}
    encoded_modes = quote(",".join(work_mode_ids[mode] for mode in work_modes), safe="")

    return (
        f"https://www.linkedin.com/jobs/search/?keywords={encoded_role}"
        f"&location={quote(location, safe='')}"
        f"&f_TPR=r{lookback_seconds}&f_WT={encoded_modes}"
    )


async def crawl_urls(urls: list[str]) -> list[CrawlResult]:
    if not urls:
        return []

    settings = get_settings()
    payload = {
        "urls": urls,
        "browser_config": {
            "type": "BrowserConfig",
            "params": {
                "enable_stealth": True,
                "headless": True,
                "user_agent_mode": "random",
                "headers": {
                    "type": "dict",
                    "value": {"Accept-Language": "en-US,en;q=0.9"},
                },
            },
        },
        "crawler_config": {
            "type": "CrawlerRunConfig",
            "params": {
                "cache_mode": "bypass",
                "magic": True,
                "page_timeout": 60_000,
                "stream": False,
                # LinkedIn renders locations and relative posting times in the
                # browser from navigator.language, which the random user agent
                # leaves random — scans came back in French and German. The
                # browser locale is what settles it; the Accept-Language header
                # above only covers server-rendered markup. Manila time also
                # keeps a relative label such as "18 minutes ago" resolving to
                # the same calendar day the date filters use.
                "locale": "en-US",
                "timezone_id": "Asia/Manila",
            },
        },
    }

    try:
        async with httpx.AsyncClient(timeout=CRAWL_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{settings.crawl4ai_base_url}/crawl", json=payload
            )
    except httpx.HTTPError as error:
        raise Crawl4AiUnavailableError(error) from error

    if response.is_error:
        raise Crawl4AiUnavailableError()

    try:
        parsed = CrawlResponse.model_validate(response.json())
    except Exception as error:
        raise Crawl4AiUnavailableError(error) from error

    if not parsed.success and not parsed.results:
        raise Crawl4AiUnavailableError()

    return parsed.results


def extract_job_urls(results: list[CrawlResult], source: JobSource) -> list[str]:
    urls: dict[str, None] = {}

    for result in results:
        for link in [*result.links.internal, *result.links.external]:
            normalized = normalize_job_url(link.href, source)

            if normalized:
                urls[normalized] = None

    return list(urls)


def normalize_job_url(url: str, source: JobSource) -> str:
    try:
        parsed = urlparse(url)

        if not parsed.hostname or get_job_source_from_url(url) != source:
            return ""

        if source == "LinkedIn":
            if not LINKEDIN_PATH.match(parsed.path):
                return ""

            hostname = urlparse(JOB_URL_PREFIXES["LinkedIn"]).hostname
        else:
            if not JOBSTREET_PATH.match(parsed.path):
                return ""

            hostname = urlparse(JOB_URL_PREFIXES["JobStreet"]).hostname

        return urlunparse(("https", hostname or "", parsed.path, "", "", ""))
    except ValueError:
        return ""


def read_markdown(result: CrawlResult) -> str:
    if isinstance(result.markdown, str):
        return result.markdown

    if isinstance(result.markdown, dict):
        raw_markdown = result.markdown.get("raw_markdown")
        return raw_markdown if isinstance(raw_markdown, str) else ""

    return ""


def is_blocked(result: CrawlResult) -> bool:
    return bool(
        BLOCKED_PATTERN.search(f"{result.error_message or ''} {read_markdown(result)}")
    )


def _summarize_crawl_batch(
    urls: list[str], results: list[CrawlResult]
) -> dict[str, dict[str, int]]:
    return {
        source: _summarize_source_crawl(source, urls, results)
        for source in JOB_SOURCES
    }


def _summarize_source_crawl(
    source: str, urls: list[str], results: list[CrawlResult]
) -> dict[str, int]:
    source_results = [
        result for result in results if get_job_source_from_url(result.url) == source
    ]

    return {
        "requestedCount": len(
            [url for url in urls if get_job_source_from_url(url) == source]
        ),
        "returnedCount": len(source_results),
        "successfulCount": len([r for r in source_results if r.success]),
        "blockedCount": len([r for r in source_results if is_blocked(r)]),
    }
