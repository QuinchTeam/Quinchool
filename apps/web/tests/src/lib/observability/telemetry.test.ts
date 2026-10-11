import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  mirrorError,
  mirrorLog,
  mirrorTransaction,
} from "../../../../src/lib/observability/telemetry.ts";

test("server summaries export OTLP logs to the shared collector, without raw Sentry content", () => {
  const original = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://127.0.0.1:4318";
  const sent = mock.method(globalThis, "fetch", async () => new Response("{}"));
  try {
    mirrorError({
      event_id: "4".repeat(32),
      exception: { values: [{ type: "Error", value: "private prompt" }] },
      contexts: {
        trace: { trace_id: "1".repeat(32), span_id: "2".repeat(16) },
      },
    });
    assert.equal(
      sent.mock.calls[0].arguments[0],
      "http://127.0.0.1:4318/v1/logs",
    );
    const body = String(sent.mock.calls[0].arguments[1]?.body);
    assert.equal(body.includes("private prompt"), false);
    assert.equal(
      JSON.parse(body).resourceLogs[0].scopeLogs[0].logRecords[0].traceId,
      "1".repeat(32),
    );
    mirrorLog({ level: "warn", message: "chatbot.get.rejected" });
    assert.equal(
      JSON.parse(String(sent.mock.calls[1].arguments[1]?.body)).resourceLogs[0]
        .scopeLogs[0].logRecords[0].severityNumber,
      13,
    );
  } finally {
    if (original === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = original;
    mock.restoreAll();
  }
});

test("expired-session delivery retries only the bounded public relay", async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );
  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
  });
  const sent = mock.method(
    globalThis,
    "fetch",
    async () => new Response("", { status: 401 }),
  );
  try {
    mirrorError({ exception: { values: [{ type: "Error" }] } });
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(sent.mock.callCount(), 2);
    assert.equal(
      sent.mock.calls[1].arguments[0],
      "http://localhost:3001/observability/web-public",
    );
    assert.equal(
      sent.mock.calls[0].arguments[1],
      sent.mock.calls[1].arguments[1],
    );
  } finally {
    mock.restoreAll();
    if (windowDescriptor)
      Object.defineProperty(globalThis, "window", windowDescriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("browser errors retain Sentry details while the relay receives only a summary", async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );
  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
  });
  const requests: RequestInit[] = [];
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init: RequestInit) => {
      requests.push(init);
      throw new Error("collector offline");
    },
  );
  const event = {
    event_id: "4".repeat(32),
    exception: { values: [{ type: "Error", value: "private resume content" }] },
    request: { headers: { authorization: "secret" } },
    contexts: { trace: { trace_id: "1".repeat(32), span_id: "2".repeat(16) } },
  };
  try {
    assert.equal(mirrorError(event), event);
    assert.equal(
      fetchMock.mock.calls[0].arguments[0],
      "http://localhost:3001/observability/web",
    );
    assert.equal(requests[0].credentials, "include");
    const payload = JSON.parse(String(requests[0].body));
    assert.equal(payload[0].eventId, event.event_id);
    assert.equal(payload[0].errorType, "Error");
    assert.equal(payload[0].traceId, "1".repeat(32));
    assert.equal(String(requests[0].body).includes("private resume"), false);
    assert.equal(String(requests[0].body).includes("secret"), false);
    await Promise.resolve();
  } finally {
    mock.restoreAll();
    if (windowDescriptor)
      Object.defineProperty(globalThis, "window", windowDescriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("browser transaction export preserves parents and drops request content", () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );
  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
  });
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async () => new Response(""),
  );
  const event = {
    type: "transaction" as const,
    start_timestamp: 1_800_000_000,
    timestamp: 1_800_000_001,
    contexts: {
      trace: {
        trace_id: "1".repeat(32),
        span_id: "2".repeat(16),
        op: "navigation",
      },
    },
    spans: [
      {
        trace_id: "1".repeat(32),
        span_id: "3".repeat(16),
        parent_span_id: "2".repeat(16),
        start_timestamp: 1_800_000_000,
        timestamp: 1_800_000_001,
        op: "http.client",
        description: "private URL",
        data: {},
      },
    ],
  };
  try {
    assert.equal(mirrorTransaction(event), event);
    const payload = JSON.parse(
      String(fetchMock.mock.calls[0].arguments[1]?.body),
    );
    assert.equal(payload.length, 2);
    assert.equal(payload[1].parentSpanId, "2".repeat(16));
    assert.equal(JSON.stringify(payload).includes("private URL"), false);
  } finally {
    mock.restoreAll();
    if (windowDescriptor)
      Object.defineProperty(globalThis, "window", windowDescriptor);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
