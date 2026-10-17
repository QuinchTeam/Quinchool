import * as Sentry from "@sentry/nextjs";
import { isAbortedConnectionError } from "../errors/is-aborted-connection-error";
import { logError, logInfo, logWarn } from "./logger";

const captured = new WeakSet<Error>();
export function captureOperationError(operation: string, error: unknown) {
  if (error instanceof Error) {
    if (captured.has(error)) return;
    captured.add(error);
  }
  const safeError = new Error(`${operation} failed`);
  if (error instanceof Error) {
    safeError.name = error.name;
    if (error.stack)
      safeError.stack = `${safeError.name}: ${safeError.message}\n${error.stack.split("\n").slice(1).join("\n")}`;
  }
  Sentry.captureException(safeError, { tags: { operation } });
}

export async function observeOperation<T>(
  operation: string,
  run: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan({ name: operation, op: operation }, async (span) => {
    logInfo(`${operation}.started`);
    try {
      const result = await run();
      if (!(result instanceof Response) || result.ok)
        logInfo(`${operation}.completed`);
      return result;
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? error.status
          : undefined;
      if (
        (error instanceof Error && error.name === "AbortError") ||
        isAbortedConnectionError(error)
      )
        logWarn(`${operation}.cancelled`);
      else if (typeof status === "number" && status >= 400 && status < 500)
        logWarn(`${operation}.rejected`);
      else {
        span.setStatus({ code: 2 });
        logError(`${operation}.failed`, error);
        captureOperationError(operation, error);
      }
      throw error;
    }
  });
}

export function apiDomain(input: string): string {
  const segments = new URL(input).pathname.split("/");
  if (segments[1] === "build-resume") return "resume-builder";
  if (
    segments[1] === "text-generation" &&
    segments[2] === "prompt-enhancements"
  )
    return "prompt-enhancer";
  if (
    segments[1] === "api" &&
    segments[2] === "auth" &&
    segments[3] === "update-user"
  )
    return "profile";
  return segments[1] === "api" && segments[2] === "auth"
    ? "auth"
    : [
          "career-profile",
          "build-resume",
          "chatbot",
          "finance-tracker",
          "jobs-scraper",
          "text-generation",
        ].includes(segments[1])
      ? segments[1]
      : "application";
}

export const apiFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const method =
    init?.method ?? (input instanceof Request ? input.method : "GET");
  const action = new URL(url).pathname.split("/")[3];
  const operation = `${apiDomain(url)}.${["sign-in", "sign-up", "sign-out", "get-session", "update-user", "request-password-reset", "reset-password"].includes(action) ? action : method.toLowerCase()}`;
  return observeOperation(operation, async () => {
    const response = await fetch(input, init);
    if (!response.ok) {
      Sentry.getActiveSpan()?.setStatus({ code: 2 });
      if (response.status >= 500) {
        logError(`${operation}.http-failed`, new Error("HttpServerError"));
        captureOperationError(operation, new Error(`HTTP ${response.status}`));
      } else logWarn(`${operation}.rejected`);
    }
    return response;
  });
};

export function pageDomain(pathname: string): string {
  if (pathname === "/") return "dashboard";
  const domain = pathname.split("/")[1];
  if (domain === "resume") return "resume-builder";
  if (domain === "node-based-flow") return "node-based-builder";
  return [
    "auth",
    "profile",
    "dashboard",
    "career-profile",
    "resume-builder",
    "chatbot",
    "finance-tracker",
    "jobs-scraper",
    "node-based-builder",
    "text-generation",
    "prompt-enhancer",
    "tools",
  ].includes(domain)
    ? domain
    : "application";
}
