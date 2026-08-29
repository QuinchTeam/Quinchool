from __future__ import annotations

import json
from datetime import datetime
from typing import cast

from app.core.config import get_settings
from app.core.logging import to_iso_z
from app.lib.jobs_scraper.rules import get_job_date_window
from app.lib.llm.providers import get_google_client
from app.validations.jobs_scraper import (
    JobDocument,
    JobExtraction,
    JobScraperConfig,
    parse_job_extraction,
)


async def extract_jobs(
    scanned_at: datetime,
    config: JobScraperConfig,
    documents: list[JobDocument],
) -> JobExtraction:
    response = await get_google_client().aio.models.generate_content(  # pyright: ignore[reportUnknownMemberType]
        model=get_settings().gemini_model,
        contents=_build_extraction_prompt(scanned_at, config, documents),
        config={
            # Nothing here calls a tool, and leaving AFC on makes the SDK warn
            # that generate_content is the wrong place for it.
            "automatic_function_calling": {"disable": True},
            "response_mime_type": "application/json",
            "response_schema": JobExtraction,
            "temperature": 0,
        },
    )

    if not response.text:
        raise RuntimeError("Google AI Studio returned no JSON output")

    payload = cast(object, json.loads(response.text))
    return parse_job_extraction(payload)


def _build_extraction_prompt(
    scanned_at: datetime, config: JobScraperConfig, documents: list[JobDocument]
) -> str:
    from_date, to_date = get_job_date_window(config, scanned_at)
    scan_time = to_iso_z(scanned_at)
    crawled_documents = "\n\n---\n\n".join(
        f"DOCUMENT {index + 1}\nSOURCE: {document.source}\nURL: {document.url}\n{document.content}"
        for index, document in enumerate(documents)
    )
    required_technology_rule = (
        f"The listing must mention at least one of: {', '.join(config.required_technologies)}."
        if config.required_technologies
        else "No technology is required."
    )
    date_rule = (
        f'Include only listings explicitly posted during the last hour relative to {scan_time}. Convert an explicit relative time such as "35 minutes ago" to postedAt; if it cannot be established, return the listing as potential.'
        if config.time_range == "LAST_HOUR"
        else f"Include only listings posted from {from_date} through {to_date}, inclusive."
    )

    return f"""Extract qualifying job listings from the crawled documents below. Do not search the web and do not invent missing details.

User criteria:
- Roles: {", ".join(config.roles)}.
- Included levels: {", ".join(config.included_levels)}.
- Excluded levels: {", ".join(config.excluded_levels)}.
- {required_technology_rule}
- Excluded technologies: {", ".join(config.excluded_technologies) or "none"}.
- Worldwide work modes: {", ".join(config.worldwide_work_modes) or "none"}.
- Additional work modes allowed for jobs in the Philippines: {", ".join(config.philippines_work_modes) or "none"}.
- {date_rule}

Rules:
- A title must match one configured role. The level must match an included level and must not match an excluded level.
- Worldwide modes apply to every country. Philippines modes apply only when the job country is the Philippines.
- A listing that mentions a configured excluded technology does not qualify. JavaScript is not Java.
- Use the document's SOURCE and exact URL. LinkedIn URLs must start with https://www.linkedin.com/jobs/view/ and JobStreet URLs must start with https://ph.jobstreet.com/job/.
- Write every field in English. If the document is in another language, translate it, including the country name and the posting label.
- Set postedDate to the Philippine calendar date. Preserve the site's visible posting label in postedText. Set postedAt only when an exact timestamp or an explicit relative posting time can support it.
- Return exactly one entry per document, in exactly one of the three lists, and never repeat a URL. Every document must be accounted for. The summary must state the relevant stack and work arrangement.

Classify each document into one list:
- jobs: it satisfies every criterion above.
- potentialJobs: the role and level qualify, but the date, work mode, or required technology is missing or unclear from the document. Explain each uncertainty in reviewReasons.
- rejectedJobs: it fails at least one criterion, or the document is not a readable job listing. State every disqualifying detail in reviewReasons, most important first, each one specific (name the excluded technology, the seniority wording, the country, or the posting date you read).

Write reviewReasons as short sentences addressed to the person reviewing the scan, so they can judge whether the verdict was correct. Fill in as much of the listing as the document supports even when rejecting it; use "Unclear" for an unknown work mode and null for an unknown posting date.

SCAN TIME: {scan_time}

CRAWLED DOCUMENTS:
{crawled_documents}"""
