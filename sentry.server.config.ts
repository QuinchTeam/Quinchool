import * as Sentry from "@sentry/nextjs";
import { isAbortedConnectionError } from "./src/lib/errors/is-aborted-connection-error";

Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  dsn: process.env.SENTRY_DSN,

  // Capture 10% of production traces.
  tracesSampleRate: 0.1,

  // v10: structured logs to Sentry.
  enableLogs: true,

  beforeSend(event, hint) {
    return isAbortedConnectionError(hint.originalException) ? null : event;
  },
});
