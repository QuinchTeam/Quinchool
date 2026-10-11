from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.trace import Status, StatusCode

from app.core.trace_exporter import sanitize_span


def test_infrastructure_export_omits_urls_payloads_and_raw_exceptions():
    provider = TracerProvider()
    exporter = InMemorySpanExporter()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    try:
        with provider.get_tracer("test").start_as_current_span(
            "GET /private?token=secret"
        ) as span:
            span.set_attribute("url.full", "private prompt")
            span.set_attribute("app.domain", "resume")
            span.record_exception(RuntimeError("private resume"))
            span.set_status(Status(StatusCode.ERROR, "private provider response"))
        original = exporter.get_finished_spans()[0]
        safe = sanitize_span(original)
        assert safe.context == original.context
        assert safe.parent == original.parent
        assert safe.start_time == original.start_time
        assert safe.status.status_code == StatusCode.ERROR
        assert safe.status.description is None
        assert safe.attributes == {"app.domain": "resume"}
        assert safe.name == "application.request"
        assert "private" not in safe.to_json()
        assert original.attributes["url.full"] == "private prompt"
    finally:
        provider.shutdown()
