import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

type ExportedSpan = Parameters<OTLPTraceExporter["export"]>[0][number];

export function sanitizeSpan(span: ExportedSpan): ExportedSpan {
  const attributes = Object.fromEntries(
    Object.entries(span.attributes).filter(([key]) =>
      [
        "app.domain",
        "http.request.method",
        "http.method",
        "http.response.status_code",
        "http.status_code",
      ].includes(key),
    ),
  );
  return {
    name: /^[a-z][a-z0-9.-]{0,79}$/i.test(span.name)
      ? span.name
      : "application.request",
    attributes,
    status: { code: span.status.code },
    events: span.events.map((event) => ({
      name: event.name === "exception" ? "exception" : "event",
      time: event.time,
      attributes:
        typeof event.attributes?.["exception.type"] === "string" &&
        /^(Error|[A-Za-z][A-Za-z0-9]*(Error|Exception))$/.test(
          event.attributes["exception.type"],
        )
          ? { "exception.type": event.attributes["exception.type"] }
          : {},
    })),
    links: span.links.map((link) => ({
      context: link.context,
      attributes: {},
    })),
    spanContext: () => span.spanContext(),
    resource: span.resource,
    instrumentationScope: span.instrumentationScope,
    startTime: span.startTime,
    endTime: span.endTime,
    duration: span.duration,
    kind: span.kind,
    parentSpanContext: span.parentSpanContext,
    ended: span.ended,
    droppedAttributesCount: span.droppedAttributesCount,
    droppedEventsCount: span.droppedEventsCount,
    droppedLinksCount: span.droppedLinksCount,
  };
}

// Sanitize only the collector export; Sentry keeps the original spans.
export class SafeTraceExporter extends OTLPTraceExporter {
  override export(
    spans: Parameters<OTLPTraceExporter["export"]>[0],
    callback: Parameters<OTLPTraceExporter["export"]>[1],
  ) {
    super.export(spans.map(sanitizeSpan), callback);
  }
}
