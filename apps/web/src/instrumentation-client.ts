import * as Sentry from "@sentry/nextjs";
import { localTransport } from "./lib/observability/local-transport";
import { exportTransaction, mirrorError } from "./lib/observability/telemetry";
import { apiTracePropagationTargets } from "./lib/observability/trace-propagation";

{
  const production = process.env.NODE_ENV === "production";
  Sentry.init({
    dsn: production
      ? process.env.NEXT_PUBLIC_SENTRY_DSN
      : "https://local@localhost/1",
    transport: production ? undefined : localTransport,

    tracesSampleRate: production ? 0.1 : 1,
    tracePropagationTargets: apiTracePropagationTargets(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
    ),
    propagateTraceparent: true,

    integrations: [
      Sentry.browserTracingIntegration({
        shouldCreateSpanForRequest: (url) =>
          !url.includes("/observability/web"),
      }),
      ...(production ? [Sentry.replayIntegration()] : []),
    ],

    // Sentry is for errors: replays only record sessions that hit one.
    replaysOnErrorSampleRate: 1.0,
    beforeSend: mirrorError,
    beforeSendTransaction: exportTransaction,
  });
}

export const onRouterTransitionStart: typeof Sentry.captureRouterTransitionStart =
  Sentry.captureRouterTransitionStart;
