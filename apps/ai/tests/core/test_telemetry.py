from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from app.core.config import Settings
from app.core.telemetry import instrument_app


def test_tracing_disabled_without_endpoint():
    with patch(
        "app.core.telemetry.get_settings",
        return_value=Settings(_env_file=None, otel_exporter_otlp_endpoint=""),
    ):
        assert instrument_app(FastAPI()) is None


def test_incoming_trace_context_is_preserved():
    app = FastAPI()
    exporter = InMemorySpanExporter()
    with (
        patch(
            "app.core.telemetry.get_settings",
            return_value=Settings(
                _env_file=None, otel_exporter_otlp_endpoint="http://localhost:4318"
            ),
        ),
        patch("app.core.telemetry.OTLPSpanExporter", return_value=exporter),
    ):
        provider = instrument_app(app)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    try:
        with TestClient(app) as client:
            response = client.get(
                "/health",
                headers={
                    "traceparent": "00-11111111111111111111111111111111-2222222222222222-01"
                },
            )
        assert response.status_code == 200
        assert provider is not None
        provider.force_flush()
        spans = exporter.get_finished_spans()
        assert len(spans) == 1
        assert spans[0].context.trace_id == int("1" * 32, 16)
        assert spans[0].parent.span_id == int("2" * 16, 16)
        assert spans[0].resource.attributes["service.name"] == "quinchool-ai"
    finally:
        if provider is not None:
            provider.shutdown()
