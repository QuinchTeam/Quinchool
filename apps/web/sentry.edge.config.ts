import * as Sentry from "@sentry/nextjs";
import { mirrorError } from "./src/lib/observability/telemetry";

// Edge records errors only because it has no collector exporter.
Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  dsn: process.env.SENTRY_DSN,
  beforeSend: mirrorError,
});
