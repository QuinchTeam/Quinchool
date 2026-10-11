import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InMemorySpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { sanitizeSpan } from "../../../../src/lib/observability/trace-exporter.ts";

test("OTLP export preserves context but leaves private Sentry span data out", () => {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  const span = provider
    .getTracer("test")
    .startSpan("GET /private?token=secret");
  span.setAttribute("url.full", "private prompt");
  span.setAttribute("app.domain", "resume-builder");
  span.recordException(new Error("private resume"));
  span.setStatus({ code: 2, message: "private provider response" });
  span.end();
  const original = exporter.getFinishedSpans()[0];
  const safe = sanitizeSpan(original);
  assert.deepEqual(safe.spanContext(), original.spanContext());
  assert.equal(safe.resource, original.resource);
  assert.deepEqual(safe.startTime, original.startTime);
  assert.deepEqual(safe.status, { code: 2 });
  assert.deepEqual(safe.attributes, { "app.domain": "resume-builder" });
  assert.equal(JSON.stringify(safe).includes("private"), false);
  assert.equal(original.attributes["url.full"], "private prompt");
  void provider.shutdown();
});
