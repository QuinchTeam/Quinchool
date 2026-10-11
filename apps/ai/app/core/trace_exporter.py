import re

from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import Event, ReadableSpan
from opentelemetry.trace import Link, Status


def sanitize_span(span: ReadableSpan) -> ReadableSpan:
    safe_keys = {
        "app.domain",
        "http.request.method",
        "http.method",
        "http.response.status_code",
        "http.status_code",
    }
    events = []
    for event in span.events:
        error_type = (event.attributes or {}).get("exception.type")
        events.append(
            Event(
                "exception" if event.name == "exception" else "event",
                {"exception.type": error_type}
                if isinstance(error_type, str)
                and re.fullmatch(
                    r"Error|[A-Za-z][A-Za-z0-9]*(Error|Exception)", error_type
                )
                else {},
                event.timestamp,
            )
        )
    return ReadableSpan(
        name=span.name
        if re.fullmatch(r"[a-zA-Z][a-zA-Z0-9.-]{0,79}", span.name)
        else "application.request",
        context=span.context,
        parent=span.parent,
        resource=span.resource,
        attributes={
            key: value
            for key, value in (span.attributes or {}).items()
            if key in safe_keys
        },
        events=events,
        links=[Link(link.context) for link in span.links],
        kind=span.kind,
        status=Status(span.status.status_code),
        start_time=span.start_time,
        end_time=span.end_time,
        instrumentation_scope=span.instrumentation_scope,
    )


class SafeTraceExporter(OTLPSpanExporter):
    def export(self, spans):
        return super().export([sanitize_span(span) for span in spans])
