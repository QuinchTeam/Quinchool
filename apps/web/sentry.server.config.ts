import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import * as Sentry from "@sentry/nextjs";
import { isAbortedConnectionError } from "./src/lib/errors/is-aborted-connection-error";
import { localTransport } from "./src/lib/observability/local-transport";
import { mirrorError, mirrorLog } from "./src/lib/observability/telemetry";
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

  // Capture 10% of production traces.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  tracePropagationTargets: apiTracePropagationTargets(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  ),
  propagateTraceparent: true,
  openTelemetrySpanProcessors: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? [new BatchSpanProcessor(new SafeTraceExporter())]
    : [],

  // v10: structured logs to Sentry.
  enableLogs: true,
  beforeSendLog: mirrorLog,

  beforeSend(event, hint) {
    return isAbortedConnectionError(hint.originalException)
      ? null
      : mirrorError(event);
  },
});
