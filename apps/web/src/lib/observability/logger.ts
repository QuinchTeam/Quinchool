import { exportLog } from "./telemetry";

// Logs go to OpenTelemetry; Sentry only receives captured errors.
export function logInfo(message: string) {
  exportLog("INFO", message);
  if (process.env.NODE_ENV !== "production") console.info(message);
}

export function logWarn(message: string) {
  exportLog("WARNING", message);
  if (process.env.NODE_ENV !== "production") console.warn(message);
}

export function logError(message: string, error: unknown) {
  exportLog(
    "ERROR",
    message,
    error instanceof Error ? error.name : typeof error,
  );
  if (process.env.NODE_ENV !== "production") console.error(message, error);
}
