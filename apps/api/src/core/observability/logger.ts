import { HttpException, type LoggerService } from "@nestjs/common";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

export function domainLog(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, string | number> = {},
) {
  const severityText = level === "warn" ? "WARNING" : level.toUpperCase();
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    logs.getLogger("quinchool.domains").emit({
      context: context.active(),
      body: event,
      severityText,
      severityNumber:
        level === "error"
          ? SeverityNumber.ERROR
          : level === "warn"
            ? SeverityNumber.WARN
            : SeverityNumber.INFO,
      attributes: { ...fields, "app.domain": fields.domain ?? "application" },
    });
  } else {
    const span = trace.getActiveSpan()?.spanContext();
    console.log(
      JSON.stringify({
        service: "quinchool-api",
        severity: severityText,
        event,
        ...fields,
        traceId: span?.traceId,
        spanId: span?.spanId,
      }),
    );
  }
}

export async function observeDomain<T>(
  operation: string,
  run: () => Promise<T>,
): Promise<T> {
  const domain = operation.split(".")[0];
  return trace
    .getTracer("quinchool.domains")
    .startActiveSpan(
      operation,
      { attributes: { "app.domain": domain } },
      async (span) => {
        domainLog("info", "operation.started", { domain, operation });
        try {
          const result = await run();
          domainLog("info", "operation.completed", { domain, operation });
          return result;
        } catch (error) {
          const reportedStatus =
            error && typeof error === "object" && "status" in error
              ? error.status
              : undefined;
          const status =
            error instanceof HttpException
              ? error.getStatus()
              : typeof reportedStatus === "number" &&
                  reportedStatus >= 400 &&
                  reportedStatus <= 599
                ? reportedStatus
                : 500;
          if (status >= 500) {
            span.setStatus({ code: SpanStatusCode.ERROR });
            span.addEvent("exception", {
              "exception.type":
                error instanceof Error ? error.name : "UnknownError",
            });
          }
          domainLog(status >= 500 ? "error" : "warn", "operation.failed", {
            domain,
            operation,
            status,
          });
          throw error;
        } finally {
          span.end();
        }
      },
    );
}

export function domainName(scope: string): string {
  const name = scope.replace(/(Controller|Service)$/, "");
  if (name === "BuildResume") return "resume-builder";
  if (name === "Chat") return "chatbot";
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Nest messages can contain private payloads; export context without message bodies.
export class TelemetryLogger implements LoggerService {
  log(message: unknown, ...args: unknown[]) {
    this.write("info", message, args);
  }
  warn(message: unknown, ...args: unknown[]) {
    this.write("warn", message, args);
  }
  error(message: unknown, ...args: unknown[]) {
    this.write("error", message, args);
  }
  debug() {}
  verbose() {}
  fatal(message: unknown, ...args: unknown[]) {
    this.write("error", message, args);
  }
  private write(
    level: "info" | "warn" | "error",
    message: unknown,
    args: unknown[],
  ) {
    const scope = args.at(-1);
    const event =
      typeof message === "string" &&
      /^(chat\.(summary\.failed|title\.failed|tool\.(unknown|invalid-arguments|step-limit))|tailor\.completed)$/.test(
        message,
      )
        ? message
        : "application.message";
    domainLog(level, event, {
      domain:
        typeof scope === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(scope)
          ? domainName(scope)
          : "application",
    });
  }
}
