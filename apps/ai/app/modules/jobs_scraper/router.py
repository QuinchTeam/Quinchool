from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
from google.genai import errors as genai_errors

from app.core.exceptions import Crawl4AiUnavailableError
from app.core.logging import log_jobs_scraper
from app.lib.llm.errors import read_provider_error_message
from app.modules.jobs_scraper.schemas import ScanRequest, ScanResult
from app.modules.jobs_scraper.service import scan_jobs

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
    # Keep Google's error wording so callers can distinguish quota and overload failures.
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
        # Preserve Google's retryable HTTP status instead of converting it to 500.
        status if 400 <= status <= 599 else 502,
    )
