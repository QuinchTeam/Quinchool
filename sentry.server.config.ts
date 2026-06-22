import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 100% of traces in dev, 10% in prod (official recommendation —
  // tune to your traffic).
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  // v10: structured logs to Sentry.
  enableLogs: true,
});
