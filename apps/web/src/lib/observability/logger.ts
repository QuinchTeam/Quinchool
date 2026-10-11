import * as Sentry from "@sentry/nextjs";

export function logInfo(message: string) {
  Sentry.logger.info(message);
  if (process.env.NODE_ENV !== "production") console.info(message);
}

export function logWarn(message: string) {
  Sentry.logger.warn(message);
  if (process.env.NODE_ENV !== "production") console.warn(message);
}

export function logError(message: string, error: unknown) {
  Sentry.logger.error(message, {
    "error.type": error instanceof Error ? error.name : typeof error,
  });
  if (process.env.NODE_ENV !== "production") console.error(message, error);
}
