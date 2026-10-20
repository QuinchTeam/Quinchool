import { isAbortedConnectionError } from "./lib/errors/is-aborted-connection-error";

type CaptureRequestError = typeof import("@sentry/nextjs").captureRequestError;

export async function register() {
  // Load runtime-specific instrumentation so Node-only dependencies stay out of Edge.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ) {
      await import("../sentry.server.config");
    }
    if (process.env.NODE_ENV === "development") {
      process.setUncaughtExceptionCaptureCallback((error) => {
        if (isAbortedConnectionError(error)) {
          return;
        }

        process.setUncaughtExceptionCaptureCallback(null);
        throw error;
      });
    }
  }
  if (
    process.env.NEXT_RUNTIME === "edge" &&
    process.env.NODE_ENV === "production"
  ) {
    await import("../sentry.edge.config");
  }
}

export async function onRequestError(...args: Parameters<CaptureRequestError>) {
  if (
    (process.env.NODE_ENV === "production" ||
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT) &&
    !isAbortedConnectionError(args[0])
  ) {
    const { captureRequestError } = await import("@sentry/nextjs");
    await captureRequestError(...args);
  }
}
