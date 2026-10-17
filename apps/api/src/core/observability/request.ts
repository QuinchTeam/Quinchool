import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import type { NextFunction, Request, Response } from "express";
import { domainLog } from "./logger";

export function requestTelemetry(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const [, segment, subresource] = request.path.split("/");
  const domain =
    segment === "build-resume"
      ? "resume-builder"
      : segment === "text-generation" && subresource === "prompt-enhancements"
        ? "prompt-enhancer"
      : segment === "api"
        ? request.path.split("/")[3] === "update-user"
          ? "profile"
          : "auth"
        : [
              "career-profile",
              "build-resume",
              "chatbot",
              "finance-tracker",
              "jobs-scraper",
              "text-generation",
            ].includes(segment)
          ? segment
          : "application";
  if (segment === "observability" || request.path === "/health") return next();
  const action = request.path.split("/")[3];
  const operation = `${domain}.${segment === "api" && ["sign-in", "sign-up", "sign-out", "get-session", "update-user", "request-password-reset", "reset-password"].includes(action) ? action : request.method.toLowerCase()}`;
  trace
    .getTracer("quinchool.domains")
    .startActiveSpan(
      operation,
      { attributes: { "app.domain": domain } },
      (span) => {
        const started = performance.now();
        domainLog("info", "request.started", {
          domain,
          operation,
          method: request.method,
        });
        let finished = false;
        const finish = (aborted: boolean) => {
          if (finished) return;
          finished = true;
          const status = aborted ? 499 : response.statusCode;
          span.setAttribute("http.response.status_code", status);
          if (status >= 500 || aborted) {
            span.setStatus({ code: SpanStatusCode.ERROR });
            span.addEvent("exception", {
              "exception.type": aborted ? "AbortError" : "HttpServerError",
            });
          }
          domainLog(
            status >= 500 ? "error" : status >= 400 ? "warn" : "info",
            aborted
              ? "request.aborted"
              : status >= 400
                ? "request.failed"
                : "request.completed",
            {
              domain,
              operation,
              method: request.method,
              status,
              durationMs: Math.round(performance.now() - started),
            },
          );
          span.end();
        };
        response.once(
          "finish",
          context.bind(context.active(), () => finish(false)),
        );
        response.once(
          "close",
          context.bind(context.active(), () =>
            finish(!response.writableFinished),
          ),
        );
        next();
      },
    );
}
