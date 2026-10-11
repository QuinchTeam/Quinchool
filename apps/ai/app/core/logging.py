"""Structured service logs. Port of apps/web/src/lib/jobs-scraper/logging.ts, so
a scan reads the same in this service's output as it did in the Next.js one.
"""

from __future__ import annotations

import json
import sys
import time
from collections.abc import Mapping
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Literal

from opentelemetry import trace
from opentelemetry._logs import SeverityNumber

LogLevel = Literal["error", "info", "warn"]
_logger = None
_span: ContextVar[trace.Span | None] = ContextVar("domain_log_span", default=None)


@contextmanager
def use_log_span(span):
    # Langfuse has its own provider; infrastructure logs must link to an exported infrastructure span.
    token = _span.set(span)
    try:
        yield
    finally:
        _span.reset(token)


def configure_logs(provider):
    global _logger
    _logger = provider.get_logger("quinchool.domains") if provider is not None else None


def create_log(
    level: LogLevel,
    service: str,
    event: str,
    fields: Mapping[str, object] | None = None,
) -> dict[str, object]:
    span = (_span.get() or trace.get_current_span()).get_span_context()
    safe_fields = {
        key: value
        for key, value in (fields or {}).items()
        if isinstance(value, (int, float, bool))
        or key
        in {
            "scanId",
            "providerId",
            "providerModelId",
            "errorName",
            "domain",
            "method",
            "operation",
        }
    }
    return {
        "timestamp": to_iso_z(datetime.now(timezone.utc)),
        "level": level,
        "service": service,
        "event": event,
        **safe_fields,
        "severity": "WARNING" if level == "warn" else level.upper(),
        **(
            {"traceId": f"{span.trace_id:032x}", "spanId": f"{span.span_id:016x}"}
            if span.is_valid
            else {}
        ),
    }


def log_event(
    level: LogLevel,
    service: str,
    event: str,
    fields: Mapping[str, object] | None = None,
) -> None:
    record = create_log(level, service, event, fields)
    if _logger is not None:
        span = _span.get() or trace.get_current_span()
        _logger.emit(
            body=event,
            context=trace.set_span_in_context(span),
            severity_number={
                "info": SeverityNumber.INFO,
                "warn": SeverityNumber.WARN,
                "error": SeverityNumber.ERROR,
            }[level],
            severity_text=record["severity"],
            attributes={
                "app.domain": "resume-builder" if service == "resume" else service,
                **{
                    key: value
                    for key, value in record.items()
                    if key not in {"timestamp", "level", "service", "event", "severity"}
                },
            },
        )
        if level == "error" or event == "provider.failed":
            span.set_status(trace.Status(trace.StatusCode.ERROR))
            span.add_event(
                "exception",
                {"exception.type": str(record.get("errorName", "DomainError"))},
            )
        return
    line = json.dumps(record, default=str)
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
