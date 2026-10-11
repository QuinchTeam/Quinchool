import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { HttpException } from "@nestjs/common";
import { webTelemetrySchema } from "../../../src/modules/observability/observability.contract";
import {
  ObservabilityService,
  webTracePayload,
  webLogPayload,
} from "../../../src/modules/observability/observability.service";

const span = {
  kind: "trace" as const,
  traceId: "1".repeat(32),
  spanId: "2".repeat(16),
  parentSpanId: "3".repeat(16),
  startTime: 1_800_000_000,
  endTime: 1_800_000_001,
  operation: "http.client",
};

test("telemetry boundary rejects private fields, malformed spans and oversized batches", () => {
  assert.ok(webTelemetrySchema.safeParse([span]).success);
  for (const record of [
    { ...span, headers: { authorization: "secret" } },
    { ...span, traceId: "0".repeat(32) },
    { ...span, endTime: span.startTime - 1 },
    { ...span, spanId: "not-a-span" },
  ])
    assert.equal(webTelemetrySchema.safeParse([record]).success, false);
  assert.equal(
    webTelemetrySchema.safeParse(Array(51).fill(span)).success,
    false,
  );
});

test("browser spans retain their original IDs and timestamps in OTLP", () => {
  const record = webTracePayload([span]).resourceSpans[0].scopeSpans[0]
    .spans[0];
  assert.equal(record.traceId, span.traceId);
  assert.equal(record.spanId, span.spanId);
  assert.equal(record.parentSpanId, span.parentSpanId);
  assert.equal(record.startTimeUnixNano, "1800000000000000000");
  assert.equal(record.endTimeUnixNano, "1800000001000000000");
});

test("browser logs use OTLP severity, original trace IDs and bounded anonymous quotas", async () => {
  const payload = webLogPayload([{ kind: "log", message: "chatbot.get.rejected", severity: "WARNING", traceId: span.traceId, spanId: span.spanId }], false);
  const record = payload.resourceLogs[0].scopeLogs[0].logRecords[0];
  assert.equal(record.severityNumber, 13);
  assert.equal(record.traceId, span.traceId);
  assert.equal(payload.resourceLogs[0].resource.attributes[1].value.boolValue, false);
  const original = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  try {
    const service = new ObservabilityService();
    for (let i = 0; i < 20; i++) await service.receive([span], "anonymous:127.0.0.1", 20);
    await assert.rejects(service.receive([span], "anonymous:127.0.0.1", 20), (error: unknown) => error instanceof HttpException && error.getStatus() === 429);
  } finally { if (original !== undefined) process.env.OTEL_EXPORTER_OTLP_ENDPOINT = original; }
});

test("relay uses the fixed collector destination; failures and quotas are bounded", async () => {
  const original = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:4318/";
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async () => new Response("{}"),
  );
  try {
    const service = new ObservabilityService();
    await service.receive([span], "user");
    assert.equal(
      fetchMock.mock.calls[0].arguments[0],
      "http://127.0.0.1:4318/v1/traces",
    );
    fetchMock.mock.mockImplementation(
      async () => new Response("", { status: 500 }),
    );
    await assert.rejects(
      service.receive([span], "other-user"),
      (error: unknown) =>
        error instanceof HttpException && error.getStatus() === 503,
    );
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    for (let i = 1; i < 120; i++) await service.receive([span], "user");
    await assert.rejects(
      service.receive([span], "user"),
      (error: unknown) =>
        error instanceof HttpException && error.getStatus() === 429,
    );
  } finally {
    if (original === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = original;
    mock.restoreAll();
  }
});

test("GCP error summaries link to both the source trace and Sentry event", async () => {
  const original = process.env.GOOGLE_CLOUD_PROJECT;
  process.env.GOOGLE_CLOUD_PROJECT = "test-project";
  const output = mock.method(console, "log", () => {});
  try {
    await new ObservabilityService().receive(
      [
        {
          kind: "error",
          message: "Web application error",
          severity: "ERROR",
          traceId: span.traceId,
          spanId: span.spanId,
          eventId: "4".repeat(32),
        },
      ],
      "user",
    );
    const record = JSON.parse(output.mock.calls[0].arguments[0]);
    assert.equal(
      record["logging.googleapis.com/trace"],
      `projects/test-project/traces/${span.traceId}`,
    );
    assert.equal(record.eventId, "4".repeat(32));
    assert.equal(record.severity, "ERROR");
  } finally {
    if (original === undefined) delete process.env.GOOGLE_CLOUD_PROJECT;
    else process.env.GOOGLE_CLOUD_PROJECT = original;
    mock.restoreAll();
  }
});
