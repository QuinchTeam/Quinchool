import asyncio
from unittest.mock import patch

import pytest
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from app.core.telemetry import domain_operation


def test_domain_operation_preserves_results_and_original_errors():
    provider = TracerProvider()
    exporter = InMemorySpanExporter()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    error = RuntimeError("private prompt")

    @domain_operation("resume.tailor")
    async def run(fail=False):
        if fail:
            raise error
        return "private resume"

    try:
        with (
            patch(
                "app.core.telemetry.domain_tracer",
                return_value=provider.get_tracer("test"),
            ),
            patch("app.core.telemetry.log_event") as log,
        ):
            assert asyncio.run(run()) == "private resume"
            with pytest.raises(RuntimeError) as caught:
                asyncio.run(run(True))
            assert caught.value is error
        spans = exporter.get_finished_spans()
        assert len(spans) == 2
        assert spans[1].status.status_code.name == "ERROR"
        assert "private" not in str(log.call_args_list)
    finally:
        provider.shutdown()
