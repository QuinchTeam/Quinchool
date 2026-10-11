from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from app.core.request_telemetry import RequestTelemetry


@pytest.mark.parametrize(
    "domain",
    ["chatbot", "jobs-scraper", "resume", "text-generation", "prompt-enhancer"],
)
@pytest.mark.parametrize("status", [200, 422, 503])
def test_every_domain_has_spans_and_outcome_logs(domain, status):
    app = FastAPI()
    app.add_middleware(RequestTelemetry)
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))

    @app.post(f"/{domain}/run")
    async def run():
        return JSONResponse({"private": "payload"}, status_code=status)

    try:
        with (
            patch(
                "app.core.request_telemetry.domain_tracer",
                return_value=provider.get_tracer("test"),
            ),
            patch("app.core.request_telemetry.log_event") as log,
            TestClient(app) as client,
        ):
            assert client.post(f"/{domain}/run").status_code == status
        span = exporter.get_finished_spans()[0]
        expected_domain = "resume-builder" if domain == "resume" else domain
        assert span.attributes["app.domain"] == expected_domain
        assert span.attributes["http.response.status_code"] == status
        assert log.call_args_list[0].args[:3] == (
            "info",
            expected_domain,
            "request.started",
        )
        assert log.call_args.args[0] == (
            "error" if status >= 500 else "warn" if status >= 400 else "info"
        )
        assert "payload" not in str(log.call_args_list)
    finally:
        provider.shutdown()
