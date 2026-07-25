import * as Sentry from "@sentry/nextjs";
import { isAbortedConnectionError } from "./lib/errors/is-aborted-connection-error";
import { registerLangfuse } from "./lib/langfuse";

export async function register() {
  // Next runs this once at startup. NEXT_RUNTIME tells us which runtime
  // we're booting in, so we load the matching config (different runtimes
  // have different capabilities — Node has profiling/Prisma, Edge doesn't).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    if (process.env.NODE_ENV === "development") {
      process.setUncaughtExceptionCaptureCallback((error) => {
        if (isAbortedConnectionError(error)) {
          return;
        }

        process.setUncaughtExceptionCaptureCallback(null);
        throw error;
      });
    }
    registerLangfuse();
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Next calls this for any server-side request error: Server Components,
// Route Handlers, Server Actions, and proxy.ts. One line replaces the
// Fastify error handler from the source guide.
export function onRequestError(
  ...args: Parameters<typeof Sentry.captureRequestError>
) {
  if (!isAbortedConnectionError(args[0])) {
    Sentry.captureRequestError(...args);
  }
}
