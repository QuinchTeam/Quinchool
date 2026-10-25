from __future__ import annotations

import json
import re
import time
from collections.abc import Sequence
from datetime import datetime
from typing import ClassVar
from urllib.parse import parse_qs, quote, urlparse, urlunparse

import google.auth.transport.requests
import google.oauth2.id_token
import httpx
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import get_settings
from app.core.exceptions import Crawl4AiUnavailableError
from app.core.logging import elapsed_ms, log_jobs_scraper
from app.core.telemetry import domain_operation
from app.lib.jobs_scraper.rules import (
    MANILA,
    get_crawl_lookback_seconds,
    get_job_source_from_url,
    get_source_job_id,
)
from app.modules.jobs_scraper.schemas import (
    JOB_SOURCES,
    JOB_URL_PREFIXES,
    JobDocument,
    JobScraperConfig,
    JobSource,
    JobSourceIssue,
    OnScanStep,
    WorkMode,
    ignore_scan_step,
)

MAX_JOBS_PER_SOURCE = 10
# Keep full tech stacks; shorter text limits caused false technology rejections.
MAX_DOCUMENT_LENGTH = 30_000
CRAWL_TIMEOUT_SECONDS = 180.0

BLOCKED_PATTERN = re.compile(
    r"additional verification required|just a moment|access denied|captcha",
    re.IGNORECASE,
)
LINKEDIN_PATH = re.compile(r"^/jobs/view/")
JOBSTREET_PATH = re.compile(r"^/job/\d+")
ONLINEJOBS_PATH = re.compile(r"^/jobseekers/job/(?:[a-zA-Z0-9-]+-)?\d+/?$")
INDEED_JOB_CARDS = 'window.mosaic.providerData["mosaic-provider-jobcards"]='


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
    html: str | None = None
    links: CrawlLinks = Field(default_factory=CrawlLinks)
    markdown: str | dict[str, object] | None = None
    status_code: int | None = None
    success: bool
    url: str


class CrawlResponse(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(extra="allow")

    results: list[CrawlResult]
    success: bool


@domain_operation("jobs-scraper.collect-documents")
async def collect_job_documents(
    scan_id: str, config: JobScraperConfig, on_step: OnScanStep = ignore_scan_step
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

    indeed_posted = read_indeed_posted_labels(search_results)
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
    await on_step("READING", len(selected_detail_urls))
    details_started_at = time.monotonic()
    # Indeed's search side-pane view serves public listings; plain /viewjob redirects to sign-in.
    detail_results = await crawl_urls(
        [
            url.replace("/viewjob?jk=", "/viewjob?viewtype=embedded&jk=")
            for url in selected_detail_urls
        ]
    )
    documents: list[JobDocument] = []

    for result in detail_results:
        source = get_job_source_from_url(result.url)
        content = read_markdown(result)

        if not source or not result.success or is_blocked(result) or not content:
            continue

        url = normalize_job_url(result.url, source)
        if not url or (source == "Indeed" and not is_indeed_listing(content, url)):
            continue

        if source == "Indeed" and (
            posted := indeed_posted.get(get_source_job_id(url, source))
        ):
            content = f"{posted}\n\n{content}"

        documents.append(
            JobDocument(
                content=content[:MAX_DOCUMENT_LENGTH],
                source=source,
                url=url,
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

        if "OnlineJobs.ph" in config.sources:
            urls.append(
                "https://www.onlinejobs.ph/jobseekers/jobsearch"
                f"?jobkeyword={encoded_role}&gig=on&partTime=on&fullTime=on"
                "&isFromJobsearchForm=1"
            )

        if "Indeed" in config.sources:
            urls.append(
                f"https://ph.indeed.com/jobs?q={encoded_role}&l=Philippines"
                f"&fromage={jobstreet_days}&sort=date"
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


@domain_operation("jobs-scraper.crawl")
async def crawl_urls(urls: list[str]) -> list[CrawlResult]:
    if not urls:
        return []

    onlinejobs_urls = [
        url for url in urls if get_job_source_from_url(url) == "OnlineJobs.ph"
    ]
    if onlinejobs_urls and len(onlinejobs_urls) != len(urls):
        other_urls = [url for url in urls if url not in onlinejobs_urls]
        return await crawl_urls(other_urls) + await crawl_urls(onlinejobs_urls)

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
                # Magic mode can strip OnlineJobs.ph's public job description.
                "magic": not onlinejobs_urls,
                **(
                    {"wait_until": "networkidle", "delay_before_return_html": 2}
                    if onlinejobs_urls
                    else {}
                ),
                "page_timeout": 60_000,
                "stream": False,
                # Pin browser locale and timezone so client-rendered labels match Manila date filters.
                "locale": "en-US",
                "timezone_id": "Asia/Manila",
            },
        },
    }

    try:
        async with httpx.AsyncClient(timeout=CRAWL_TIMEOUT_SECONDS) as client:
            response = await client.post(
                f"{settings.crawl4ai_base_url}/crawl",
                json=payload,
                headers=_authorization_header(settings.crawl4ai_base_url),
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


def _authorization_header(base_url: str) -> dict[str, str]:
    # Cloud Run checks audience-bound ID tokens; local HTTP calls need none.
    if not base_url.startswith("https://"):
        return {}

    token = google.oauth2.id_token.fetch_id_token(
        google.auth.transport.requests.Request(), base_url
    )

    return {"Authorization": f"Bearer {token}"}


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

        if source == "Indeed":
            job_ids = parse_qs(parsed.query).get("jk", [])
            if (
                parsed.path not in {"/viewjob", "/rc/clk", "/pagead/clk"}
                or len(job_ids) != 1
                or not re.fullmatch(r"[a-fA-F0-9]{16}", job_ids[0])
            ):
                return ""

            return f"{JOB_URL_PREFIXES['Indeed']}{job_ids[0].lower()}"

        if source == "LinkedIn":
            if not LINKEDIN_PATH.match(parsed.path):
                return ""

            hostname = urlparse(JOB_URL_PREFIXES["LinkedIn"]).hostname
        elif source == "JobStreet":
            if not JOBSTREET_PATH.match(parsed.path):
                return ""

            hostname = urlparse(JOB_URL_PREFIXES["JobStreet"]).hostname
        else:
            if not ONLINEJOBS_PATH.fullmatch(parsed.path):
                return ""

            hostname = urlparse(JOB_URL_PREFIXES["OnlineJobs.ph"]).hostname

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
        result.status_code in {401, 403, 429}
        or BLOCKED_PATTERN.search(
            f"{result.error_message or ''} {read_markdown(result)}"
        )
    )


def is_indeed_listing(content: str, url: str) -> bool:
    # Rejects sign-in/verification pages (often 200 or 307) and panes bound to another job.
    job_ids = set(re.findall(r"fromjk=([a-f0-9]{16})", content))
    return "Full job description" in content and job_ids <= {
        get_source_job_id(url, "Indeed")
    }


def read_indeed_posted_labels(results: list[CrawlResult]) -> dict[str, str]:
    # Indeed dates exist only in search-card JSON; createDate drives its visible "N days ago" label.
    labels: dict[str, str] = {}

    for result in results:
        html = result.html or ""
        start = html.find(INDEED_JOB_CARDS)
        if start < 0:
            continue

        try:
            data, _ = json.JSONDecoder().raw_decode(html, start + len(INDEED_JOB_CARDS))
            jobs = data["metaData"]["mosaicProviderJobCardsModel"]["results"]
        except (KeyError, TypeError, ValueError):
            continue

        for job in jobs:
            job_id, created_ms = job.get("jobkey"), job.get("createDate")
            if isinstance(job_id, str) and isinstance(created_ms, int):
                posted_at = datetime.fromtimestamp(created_ms / 1000, MANILA)
                labels[job_id] = (
                    f"Posted on Indeed: {job.get('formattedRelativeTime', '')} "
                    f"({posted_at.isoformat(timespec='minutes')})"
                )

    return labels


def _summarize_crawl_batch(
    urls: list[str], results: list[CrawlResult]
) -> dict[str, dict[str, int]]:
    return {
        source: _summarize_source_crawl(source, urls, results) for source in JOB_SOURCES
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
