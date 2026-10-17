import * as Sentry from "@sentry/nextjs";
import { mirrorError } from "./src/lib/observability/telemetry";

// Errors only: edge has no collector exporter, so it records no traces.
Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  dsn: process.env.SENTRY_DSN,
  beforeSend: mirrorError,
});
