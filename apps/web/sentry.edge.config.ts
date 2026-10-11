import * as Sentry from "@sentry/nextjs";
import { mirrorError, mirrorLog } from "./src/lib/observability/telemetry";

Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enableLogs: true,
  beforeSend: mirrorError,
  beforeSendLog: mirrorLog,
});
