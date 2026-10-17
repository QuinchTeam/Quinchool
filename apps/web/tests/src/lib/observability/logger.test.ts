import assert from "node:assert/strict";
import { test, vi } from "vite-plus/test";
import { logError } from "../../../../src/lib/observability/logger.ts";

test("production logs go to the OpenTelemetry collector without raw error content; development keeps console diagnostics", () => {
  const originalEnvironment = process.env.NODE_ENV;
  const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const sent = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response("{}"));
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const error = new Error("private resume content");
  try {
    Object.assign(process.env, {
      NODE_ENV: "production",
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318",
    });
    logError("Could not generate the resume PDF", error);
    assert.equal(sent.mock.calls[0][0], "http://127.0.0.1:4318/v1/logs");
    const body = sent.mock.calls[0][1]?.body as string;
    const record = JSON.parse(body).resourceLogs[0].scopeLogs[0].logRecords[0];
    assert.equal(record.body.stringValue, "Could not generate the resume PDF");
    assert.equal(record.severityText, "ERROR");
    assert.equal(body.includes("private resume content"), false);
    assert.equal(consoleError.mock.calls.length, 0);

    Object.assign(process.env, { NODE_ENV: "development" });
    Reflect.deleteProperty(process.env, "OTEL_EXPORTER_OTLP_ENDPOINT");
    logError("Could not generate the resume PDF", error);
    assert.deepEqual(consoleError.mock.calls[0], [
      "Could not generate the resume PDF",
      error,
    ]);
    assert.equal(
      sent.mock.calls.length,
      1,
      "local servers without a collector skip the export",
    );
  } finally {
    if (originalEnvironment === undefined)
      Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: originalEnvironment });
    if (originalEndpoint === undefined)
      Reflect.deleteProperty(process.env, "OTEL_EXPORTER_OTLP_ENDPOINT");
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint;
    vi.restoreAllMocks();
  }
});
