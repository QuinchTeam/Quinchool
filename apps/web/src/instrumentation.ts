import { isAbortedConnectionError } from "./lib/errors/is-aborted-connection-error";

type CaptureRequestError = typeof import("@sentry/nextjs").captureRequestError;

export async function register() {
  // Next runs this once at startup. NEXT_RUNTIME tells us which runtime
  // we're booting in, so we load the matching config (different runtimes
  // have different capabilities — Node has profiling/Prisma, Edge doesn't).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NODE_ENV === "production") {
      const [{ registerLangfuse }] = await Promise.all([
        import("./lib/langfuse"),
        import("../sentry.server.config"),
      ]);
      registerLangfuse();
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

// Next calls this for any server-side request error: Server Components,
// Route Handlers, Server Actions, and proxy.ts. One line replaces the
// Fastify error handler from the source guide.
export async function onRequestError(...args: Parameters<CaptureRequestError>) {
  if (
    process.env.NODE_ENV === "production" &&
    !isAbortedConnectionError(args[0])
  ) {
    const { captureRequestError } = await import("@sentry/nextjs");
    await captureRequestError(...args);
  }
}
