from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any, Literal, Protocol, final

from opentelemetry import trace

from app.core.config import get_settings
from app.core.logging import log_event, use_log_span
from app.core.telemetry import domain_tracer

ObservationType = Literal["chain", "generation", "span"]


class Observation(Protocol):
    def update(self, **kwargs: Any) -> Any: ...


@final
class NoObservation:
    def update(self, **kwargs: Any) -> None:
        return None


_client: Any = None
_resolved = False


def _get_client() -> Any:
    global _client, _resolved

    if _resolved:
        return _client

    _resolved = True
    settings = get_settings()
    public_key = settings.langfuse_public_key.strip()
    secret_key = settings.langfuse_secret_key.strip()

    if not public_key or not secret_key:
        return None

    try:
        from langfuse import Langfuse
        from opentelemetry.sdk.trace import TracerProvider

        _client = Langfuse(
            public_key=public_key,
            secret_key=secret_key,
            host=settings.langfuse_host.strip() or None,
            # Share trace context while keeping AI payloads out of infrastructure exports.
            tracer_provider=(
                TracerProvider() if settings.otel_exporter_otlp_endpoint else None
            ),
        )
    except Exception:  # noqa: BLE001 - a broken tracer must not take generation down
        _client = None

    return _client


@contextmanager
def observe(
    name: str, *, as_type: ObservationType, **fields: Any
) -> Iterator[Observation]:
    with (
        domain_tracer().start_as_current_span(
            name,
            attributes={"app.domain": "llm"},
            record_exception=False,
            set_status_on_exception=False,
        ) as span,
        use_log_span(span),
    ):
        client = _get_client()
        log_event("info", "llm", "operation.started")
        try:
            if client is None:
                yield NoObservation()
            else:
                with client.start_as_current_observation(
                    name=name, as_type=as_type, **fields
                ) as observation:
                    yield observation
            log_event("info", "llm", "operation.completed")
        except Exception as error:
            span.set_status(trace.Status(trace.StatusCode.ERROR))
            span.add_event("exception", {"exception.type": type(error).__name__})
            log_event(
                "error", "llm", "operation.failed", {"errorName": type(error).__name__}
            )
            raise


def usage_details(
    input_tokens: int | None, output_tokens: int | None
) -> dict[str, int]:
    # Langfuse accepts integer token counts; providers can omit them.
    counts = {"input": input_tokens, "output": output_tokens}

    return {key: value for key, value in counts.items() if value is not None}
