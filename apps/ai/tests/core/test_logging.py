from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk._logs.export import (
    InMemoryLogRecordExporter,
    SimpleLogRecordProcessor,
)
from opentelemetry.sdk.trace import TracerProvider

from app.core.logging import configure_logs, log_event, use_log_span


def test_otlp_logs_preserve_severity_and_trace_without_private_fields():
    exporter = InMemoryLogRecordExporter()
    provider = LoggerProvider()
    provider.add_log_record_processor(SimpleLogRecordProcessor(exporter))
    configure_logs(provider)
    tracer = TracerProvider()
    try:
        with (
            tracer.get_tracer("test").start_as_current_span("chatbot.respond") as span,
            use_log_span(span),
            tracer.get_tracer("langfuse").start_as_current_span("private generation"),
        ):
            log_event(
                "warn",
                "chatbot",
                "provider.failed",
                {
                    "errorMessage": "private prompt",
                    "errorName": "RuntimeError",
                    "attempt": 1,
                },
            )
        record = exporter.get_finished_logs()[0].log_record
        assert record.trace_id == span.get_span_context().trace_id
        assert record.span_id == span.get_span_context().span_id
        assert record.severity_text == "WARNING"
        assert record.attributes["app.domain"] == "chatbot"
        assert span.status.status_code.name == "ERROR"
        assert "private prompt" not in str(record.attributes)
    finally:
        configure_logs(None)
        provider.shutdown()
        tracer.shutdown()
