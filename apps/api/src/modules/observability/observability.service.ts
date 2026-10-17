import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { WebTelemetry } from "./observability.contract";

export function webTracePayload(records: WebTelemetry, authenticated = true) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            {
              key: "app.telemetry.authenticated",
              value: { boolValue: authenticated },
            },
            {
              key: "service.name",
              value: { stringValue: "quinchool-web-browser" },
            },
          ],
        },
        scopeSpans: [
          {
            scope: { name: "quinchool.sentry" },
            spans: records
              .filter((record) => record.kind === "trace")
              .map((record) => {
                return {
                  traceId: record.traceId,
                  spanId: record.spanId,
                  parentSpanId: record.parentSpanId,
                  name: record.operation,
                  attributes: [
                    {
                      key: "app.domain",
                      value: {
                        stringValue:
                          record.domain ?? record.operation.split(".")[0],
                      },
                    },
                  ],
                  kind:
                    record.operation === "http.client"
                      ? 3
                      : record.operation === "http.server"
                        ? 2
                        : 1,
                  status: {
                    code:
                      record.status === undefined
                        ? 0
                        : record.status === "ok"
                          ? 1
                          : 2,
                  },
                  startTimeUnixNano: (
                    BigInt(Math.round(record.startTime * 1e6)) * 1000n
                  ).toString(),
                  endTimeUnixNano: (
                    BigInt(Math.round(record.endTime * 1e6)) * 1000n
                  ).toString(),
                };
              }),
          },
        ],
      },
    ],
  };
}

export function webLogPayload(records: WebTelemetry, authenticated = true) {
  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            {
              key: "service.name",
              value: { stringValue: "quinchool-web-browser" },
            },
            {
              key: "app.telemetry.authenticated",
              value: { boolValue: authenticated },
            },
          ],
        },
        scopeLogs: [
          {
            scope: { name: "quinchool.sentry" },
            logRecords: records
              .filter((record) => record.kind !== "trace")
              .map((record) => ({
                timeUnixNano: (BigInt(Date.now()) * 1_000_000n).toString(),
                body: { stringValue: record.message },
                severityText: record.severity,
                severityNumber: {
                  DEBUG: 5,
                  INFO: 9,
                  WARNING: 13,
                  ERROR: 17,
                  CRITICAL: 21,
                }[record.severity],
                traceId: record.traceId,
                spanId: record.spanId,
                attributes: [
                  {
                    key: "app.domain",
                    value: { stringValue: record.domain ?? "application" },
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
  };
}

@Injectable()
export class ObservabilityService {
  // shortcut: quotas are per instance; use shared limits if abuse spans replicas.
  private readonly windows = new Map<
    string,
    { count: number; until: number }
  >();

  async receive(records: WebTelemetry, userId: string, limit = 120) {
    const now = Date.now();
    for (const [id, window] of this.windows) {
      if (window.until <= now) this.windows.delete(id);
    }
    const window = this.windows.get(userId) ?? {
      count: 0,
      until: now + 60_000,
    };
    if (
      window.count >= limit ||
      (this.windows.size >= 1000 && !this.windows.has(userId))
    ) {
      throw new HttpException(
        { code: "TELEMETRY_RATE_LIMITED", message: "Telemetry rate limit" },
        429,
      );
    }
    window.count++;
    this.windows.set(userId, window);

    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    for (const record of records) {
      if (record.kind === "trace") continue;
      if (endpoint) continue;
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      console.log(
        JSON.stringify({
          ...record,
          authenticated: !userId.startsWith("anonymous:"),
          service: "quinchool-web-browser",
          ...(project && record.traceId
            ? {
                "logging.googleapis.com/trace": `projects/${project}/traces/${record.traceId}`,
                "logging.googleapis.com/spanId": record.spanId,
              }
            : {}),
        }),
      );
    }
    if (!endpoint) return;
    try {
      const authenticated = !userId.startsWith("anonymous:");
      const payloads = [
        ...(records.some((record) => record.kind === "trace")
          ? [
              {
                signal: "traces",
                body: webTracePayload(records, authenticated),
              },
            ]
          : []),
        ...(records.some((record) => record.kind !== "trace")
          ? [{ signal: "logs", body: webLogPayload(records, authenticated) }]
          : []),
      ];
      await Promise.all(
        payloads.map(async (payload) => {
          const response = await fetch(
            `${endpoint.replace(/\/$/, "")}/v1/${payload.signal}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload.body),
              signal: AbortSignal.timeout(3000),
            },
          );
          if (!response.ok) throw new Error("Collector rejected telemetry");
        }),
      );
    } catch {
      throw new ServiceUnavailableException({
        code: "TELEMETRY_UNAVAILABLE",
        message: "Telemetry unavailable",
      });
    }
  }
}
