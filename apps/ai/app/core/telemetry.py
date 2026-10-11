from collections.abc import Awaitable, Callable
from functools import wraps
from typing import ParamSpec, TypeVar

from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from app.core.config import get_settings
from app.core.logging import configure_logs, log_event, use_log_span
from app.core.trace_exporter import SafeTraceExporter

P = ParamSpec("P")
T = TypeVar("T")

_provider: TracerProvider | None = None
_log_provider: LoggerProvider | None = None


def domain_tracer():
    return (_provider or trace.get_tracer_provider()).get_tracer("quinchool.domains")


def domain_operation(name: str):
    def decorate(run: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
        @wraps(run)
        async def wrapped(*args: P.args, **kwargs: P.kwargs) -> T:
            domain = name.split(".")[0]
            with (
                domain_tracer().start_as_current_span(
                    name,
                    attributes={"app.domain": domain},
                    record_exception=False,
                    set_status_on_exception=False,
                ) as span,
                use_log_span(span),
            ):
                log_event("info", domain, "operation.started", {"operation": name})
                try:
                    result = await run(*args, **kwargs)
                    log_event(
                        "info", domain, "operation.completed", {"operation": name}
                    )
                    return result
                except Exception as error:
                    span.set_status(trace.Status(trace.StatusCode.ERROR))
                    log_event(
                        "error",
                        domain,
                        "operation.failed",
                        {"operation": name, "errorName": type(error).__name__},
                    )
                    raise

        return wrapped

    return decorate


def shutdown_logs():
    if _log_provider is not None:
        _log_provider.shutdown()
    configure_logs(None)


def instrument_app(app: FastAPI) -> TracerProvider | None:
    global _provider, _log_provider
    endpoint = get_settings().otel_exporter_otlp_endpoint.strip()
    if not endpoint:
        _provider = None
        configure_logs(None)
        return None

    provider = TracerProvider(
        resource=Resource.create({"service.name": "quinchool-ai"})
    )
    provider.add_span_processor(
        BatchSpanProcessor(
            SafeTraceExporter(endpoint=f"{endpoint.rstrip('/')}/v1/traces")
        )
    )
    _provider = provider
    _log_provider = LoggerProvider(resource=provider.resource)
    _log_provider.add_log_record_processor(
        BatchLogRecordProcessor(
            OTLPLogExporter(endpoint=f"{endpoint.rstrip('/')}/v1/logs")
        )
    )
    configure_logs(_log_provider)
    FastAPIInstrumentor.instrument_app(
        app, tracer_provider=provider, exclude_spans=["send", "receive"]
    )
    return provider
