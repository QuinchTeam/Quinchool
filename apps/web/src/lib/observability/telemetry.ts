import type { Event } from "@sentry/nextjs";
import { getTraceData } from "@sentry/nextjs";
import { apiUrl, withCredentials } from "../api";
import { pageDomain } from "./operation";

type TelemetryRecord = {
  kind: "error" | "log" | "trace";
  message?: string;
  severity?: string;
  eventId?: string;
  errorType?: string;
  domain?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  startTime?: number;
  endTime?: number;
  operation?: string;
  status?: string;
};

function report(records: TelemetryRecord[]) {
  if (typeof window === "undefined") {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (endpoint) {
      void fetch(`${endpoint.replace(/\/$/, "")}/v1/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000),
        body: JSON.stringify({
          resourceLogs: [
            {
              resource: {
                attributes: [
                  {
                    key: "service.name",
                    value: { stringValue: "quinchool-web" },
                  },
                ],
              },
              scopeLogs: [
                {
                  scope: { name: "quinchool.sentry" },
                  logRecords: records
                    .filter((record) => record.kind !== "trace")
                    .map((record) => ({
                      timeUnixNano: (
                        BigInt(Date.now()) * BigInt(1_000_000)
                      ).toString(),
                      body: { stringValue: record.message },
                      severityText: record.severity,
                      severityNumber: (
                        {
                          DEBUG: 5,
                          INFO: 9,
                          WARNING: 13,
                          ERROR: 17,
                          CRITICAL: 21,
                        } as Record<string, number>
                      )[record.severity ?? "ERROR"],
                      traceId: record.traceId,
                      spanId: record.spanId,
                      attributes: [
                        {
                          key: "app.domain",
                          value: {
                            stringValue: record.domain ?? "application",
                          },
                        },
                        ...(record.eventId
                          ? [
                              {
                                key: "sentry.event_id",
                                value: { stringValue: record.eventId },
                              },
                            ]
                          : []),
                        ...(record.errorType
                          ? [
                              {
                                key: "error.type",
                                value: { stringValue: record.errorType },
                              },
                            ]
                          : []),
                      ],
                    })),
                },
              ],
            },
          ],
        }),
      }).catch(() => {});
      return;
    }
    for (const record of records) {
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      console.log(
        JSON.stringify({
          ...record,
          severity: record.severity ?? "ERROR",
          service: "quinchool-web",
          ...(project && record.traceId
            ? {
                "logging.googleapis.com/trace": `projects/${project}/traces/${record.traceId}`,
                "logging.googleapis.com/spanId": record.spanId,
              }
            : {}),
        }),
      );
    }
    return;
  }

  // Failed telemetry delivery must not affect requests or recursively report itself.
  const init = {
    ...withCredentials,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(records),
    keepalive: true,
  };
  void fetch(apiUrl("/observability/web"), init)
    .then((response) => {
      if (response.status === 401)
        return fetch(apiUrl("/observability/web-public"), init);
    })
    .catch(() => {});
}

export function mirrorError<T extends Event>(event: T): T {
  const trace = event.contexts?.trace;
  const operation = event.tags?.operation;
  report([
    {
      kind: "error",
      message: "Web application error",
      severity: "ERROR",
      domain: telemetryDomain(typeof operation === "string" ? operation : ""),
      eventId: event.event_id,
      errorType: event.exception?.values?.at(-1)?.type?.slice(0, 80),
      traceId: trace?.trace_id,
      spanId: trace?.span_id,
    },
  ]);
  return event;
}

export function exportLog(
  severity: "INFO" | "WARNING" | "ERROR",
  message: string,
  errorType?: string,
) {
  // Without a collector, local server logs fall back to the console.
  if (
    typeof window === "undefined" &&
    process.env.NODE_ENV !== "production" &&
    !process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  )
    return;
  const trace = getTraceData()["sentry-trace"]?.split("-");
  report([
    {
      kind: "log",
      domain: telemetryDomain(message),
      message: message.slice(0, 512),
      errorType: errorType?.slice(0, 80),
      severity,
      traceId: trace?.[0],
      spanId: trace?.[1],
    },
  ]);
}

function telemetryDomain(operation: string): string {
  const domain = operation.split(".")[0];
  return [
    "auth",
    "profile",
    "dashboard",
    "career-profile",
    "resume-builder",
    "build-resume",
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

// Return null to send traces only to the collector, never to Sentry.
export function exportTransaction(event: Event): null {
  const root = event.contexts?.trace;
  if (!root?.trace_id || !root.span_id) return null;
  const rootDomain = event.transaction?.startsWith("/")
    ? pageDomain(event.transaction.split("?")[0])
    : telemetryDomain(root.op ?? "");
  const spans = [
    {
      trace_id: root.trace_id,
      span_id: root.span_id,
      parent_span_id: root.parent_span_id,
      start_timestamp: event.start_timestamp,
      timestamp: event.timestamp,
      op: root.op,
      status: root.status,
    },
    ...(event.spans ?? []),
  ];
  const records: TelemetryRecord[] = spans
    .filter(
      (span) =>
        span.start_timestamp !== undefined && span.timestamp !== undefined,
    )
    .map((span) => ({
      kind: "trace",
      domain:
        telemetryDomain(span.op ?? "") === "application"
          ? rootDomain
          : telemetryDomain(span.op ?? ""),
      traceId: root.trace_id,
      spanId: span.span_id,
      parentSpanId: span.parent_span_id,
      startTime: span.start_timestamp,
      endTime: span.timestamp,
      operation: span.op?.slice(0, 80) ?? "web.request",
      status: span.status,
    }));
  for (let offset = 0; offset < records.length; offset += 50) {
    report(records.slice(offset, offset + 50));
  }
  return null;
}
