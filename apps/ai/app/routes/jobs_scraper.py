"""HTTP surface for a job scan. Stateless: config in, graded listings out.

The caller (Nest) owns the scan id, the config, and the persistence that
apps/web/src/app/api/jobs-scraper/route.ts used to do inline.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import cast

from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
from google.genai import errors as genai_errors

from app.core.exceptions import Crawl4AiUnavailableError
from app.core.logging import log_jobs_scraper
from app.services.jobs_scraper import scan_jobs
from app.validations.jobs_scraper import ScanRequest, ScanResult

router = APIRouter(prefix="/jobs-scraper", tags=["jobs-scraper"])


@router.post("/scan", response_model=ScanResult, response_model_by_alias=True)
async def scan(request: ScanRequest, response: Response):
    scanned_at = request.scanned_at or datetime.now(timezone.utc)

    if scanned_at.tzinfo is None:
        scanned_at = scanned_at.replace(tzinfo=timezone.utc)

    response.headers["X-Jobs-Scan-Id"] = request.scan_id

    try:
        return await scan_jobs(request.scan_id, request.config, scanned_at)
    except (Crawl4AiUnavailableError, genai_errors.APIError) as error:
        message, status = get_scan_failure(error)

        log_jobs_scraper(
            "error",
            "scan.failed",
            request.scan_id,
            {
                "cause": str(getattr(error, "cause", None) or "") or None,
                "errorMessage": message,
                "errorName": type(error).__name__,
                "providerStatus": getattr(error, "code", None),
                "status": status,
            },
        )

        return JSONResponse(
            {"error": message, "scanId": request.scan_id},
            status_code=status,
            headers={"X-Jobs-Scan-Id": request.scan_id},
        )


def get_scan_failure(
    error: Crawl4AiUnavailableError | genai_errors.APIError,
) -> tuple[str, int]:
    """Turns a scan failure into the sentence the user reads. Gemini's own
    wording says more than any generic message can — whether the model is
    overloaded, the quota is spent, or the request was rejected — so it is
    passed through.
    """
    if isinstance(error, Crawl4AiUnavailableError):
        return "Crawl4AI is offline. Start the crawl4ai Docker service.", 503

    detail = read_provider_error_message(error)
    status = error.code or 0

    if status == 429:
        return (
            f"Gemini quota exceeded. {detail or 'Try again after the quota resets.'}",
            429,
        )

    return (
        f"Gemini could not classify this scan. {detail or f'The API returned {status}.'}",
        # Google's status is already an HTTP code; forward it so a 503 still
        # reads as "retry later" instead of a flat server error.
        status if 400 <= status <= 599 else 502,
    )


def read_provider_error_message(error: genai_errors.APIError) -> str | None:
    """The readable sentence behind a provider failure. Google can hand back the
    whole HTTP error body, so the useful text arrives wrapped in a JSON
    envelope: {"error":{"code":503,"message":"...","status":"UNAVAILABLE"}}.
    """
    message = error.message or ""

    try:
        payload = cast(object, json.loads(message))
    except ValueError:
        return message or None

    if not isinstance(payload, dict):
        return message or None

    error_payload = cast(dict[str, object], payload).get("error")

    if not isinstance(error_payload, dict):
        return message or None

    nested = cast(dict[str, object], error_payload).get("message")
    return nested if isinstance(nested, str) and nested else (message or None)
