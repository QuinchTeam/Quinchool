import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import * as Sentry from "@sentry/nextjs";
import { isAbortedConnectionError } from "./src/lib/errors/is-aborted-connection-error";
import { localTransport } from "./src/lib/observability/local-transport";
import { mirrorError } from "./src/lib/observability/telemetry";
import { SafeTraceExporter } from "./src/lib/observability/trace-exporter";
import { apiTracePropagationTargets } from "./src/lib/observability/trace-propagation";

Sentry.init({
  enabled:
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT),
  dsn:
    process.env.NODE_ENV === "production"
      ? process.env.SENTRY_DSN
      : "https://local@localhost/1",
  transport: process.env.NODE_ENV === "production" ? undefined : localTransport,

  // Sample 10% of production traces for the OpenTelemetry collector.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  tracePropagationTargets: apiTracePropagationTargets(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  ),
  propagateTraceparent: true,
  openTelemetrySpanProcessors: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? [new BatchSpanProcessor(new SafeTraceExporter())]
    : [],

  // ponytail: Sentry stays the span engine but only receives errors; sampled
  // spans reach the collector via the processor above. Switch to an own
  // NodeSDK with skipOpenTelemetrySetup if Sentry's span overhead matters.
  beforeSendTransaction: () => null,

  beforeSend(event, hint) {
    return isAbortedConnectionError(hint.originalException)
      ? null
      : mirrorError(event);
  },
});
