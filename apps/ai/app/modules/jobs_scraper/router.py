from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from google.genai import errors as genai_errors

from app.core.exceptions import Crawl4AiUnavailableError
from app.core.logging import log_jobs_scraper
from app.lib.llm.errors import read_provider_error_message
from app.modules.jobs_scraper.schemas import ScanRequest, ScanStep
from app.modules.jobs_scraper.service import scan_jobs

router = APIRouter(prefix="/jobs-scraper", tags=["jobs-scraper"])


# Streams NDJSON so the API can show progress: {"type":"step",...} lines, then exactly one
# {"type":"result"} or {"type":"error"} line. Failures arrive in-band because the 200 is already sent.
@router.post("/scan")
async def scan(request: ScanRequest) -> StreamingResponse:
    scanned_at = request.scanned_at or datetime.now(timezone.utc)

    if scanned_at.tzinfo is None:
        scanned_at = scanned_at.replace(tzinfo=timezone.utc)

    return StreamingResponse(
        _stream_scan(request, scanned_at),
        media_type="application/x-ndjson",
        headers={"X-Jobs-Scan-Id": request.scan_id},
    )


async def _stream_scan(
    request: ScanRequest, scanned_at: datetime
) -> AsyncIterator[str]:
    queue: asyncio.Queue[dict[str, object] | None] = asyncio.Queue()

    async def on_step(step: ScanStep, count: int | None) -> None:
        await queue.put({"type": "step", "step": step, "count": count})

    task = asyncio.create_task(
        scan_jobs(request.scan_id, request.config, scanned_at, on_step)
    )
    task.add_done_callback(lambda _: queue.put_nowait(None))

    try:
        while (event := await queue.get()) is not None:
            yield _line(event)

        try:
            result = task.result()
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
            yield _line({"type": "error", "error": message, "status": status})
            return
        except Exception as error:
            log_jobs_scraper(
                "error",
                "scan.failed",
                request.scan_id,
                {"errorName": type(error).__name__, "status": 500},
            )
            yield _line(
                {"type": "error", "error": "The job scan failed.", "status": 500}
            )
            # Re-raise so unexpected bugs still reach error reporting.
            raise

        yield _line(
            {"type": "result", "result": result.model_dump(by_alias=True, mode="json")}
        )
    finally:
        # The API hung up (timeout or shutdown): stop crawling and Gemini work.
        if not task.done():
            task.cancel()


def _line(event: dict[str, object]) -> str:
    return json.dumps(event) + "\n"


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
