import * as Sentry from "@sentry/nextjs";
import { registerLangfuse } from "./lib/langfuse";

export async function register() {
  // Next runs this once at startup. NEXT_RUNTIME tells us which runtime
  // we're booting in, so we load the matching config (different runtimes
  // have different capabilities — Node has profiling/Prisma, Edge doesn't).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    registerLangfuse();
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Next calls this for any server-side request error: Server Components,
// Route Handlers, Server Actions, and proxy.ts. One line replaces the
// Fastify error handler from the source guide.
export const onRequestError = Sentry.captureRequestError;
