"""Structured service logs. Port of apps/web/src/lib/jobs-scraper/logging.ts, so
a scan reads the same in this service's output as it did in the Next.js one.
"""

from __future__ import annotations

import json
import sys
import time
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Literal

LogLevel = Literal["error", "info", "warn"]


def create_log(
    level: LogLevel,
    service: str,
    event: str,
    fields: Mapping[str, object] | None = None,
) -> dict[str, object]:
    return {
        "timestamp": to_iso_z(datetime.now(timezone.utc)),
        "level": level,
        "service": service,
        "event": event,
        **(fields or {}),
    }


def log_event(
    level: LogLevel,
    service: str,
    event: str,
    fields: Mapping[str, object] | None = None,
) -> None:
    line = json.dumps(create_log(level, service, event, fields), default=str)
    stream = sys.stderr if level in ("error", "warn") else sys.stdout
    print(line, file=stream, flush=True)


def log_jobs_scraper(
    level: LogLevel,
    event: str,
    scan_id: str,
    fields: Mapping[str, object] | None = None,
) -> None:
    log_event(level, "jobs-scraper", event, {"scanId": scan_id, **(fields or {})})


def elapsed_ms(started_at: float) -> int:
    """Milliseconds since a time.monotonic() reading."""
    return round((time.monotonic() - started_at) * 1000)


def to_iso_z(value: datetime) -> str:
    """The `2026-08-29T04:05:06.000Z` shape JavaScript's toISOString() emits."""
    return (
        value.astimezone(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )
