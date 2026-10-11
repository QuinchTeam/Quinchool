import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as Sentry from "@sentry/nextjs";
import { localTransport } from "../../../../src/lib/observability/local-transport.ts";
import {
  apiDomain,
  apiFetch,
  observeOperation,
  pageDomain,
} from "../../../../src/lib/observability/operation.ts";

test("every API domain has a bounded operation name without IDs, queries or secrets", () => {
  for (const domain of [
    "career-profile",
    "build-resume",
    "chatbot",
    "finance-tracker",
    "jobs-scraper",
    "text-generation",
    "prompt-enhancer",
  ]) {
    assert.equal(
      apiDomain(`http://localhost:3001/${domain}/private-id?token=secret`),
      domain === "build-resume" ? "resume-builder" : domain,
    );
  }
  assert.equal(
    apiDomain("http://localhost:3001/api/auth/sign-in/email"),
    "auth",
  );
  assert.equal(
    apiDomain("http://localhost:3001/api/auth/update-user"),
    "profile",
  );
  assert.equal(apiDomain("http://localhost:3001/private-id"), "application");
  assert.equal(pageDomain("/"), "dashboard");
  assert.equal(pageDomain("/tools"), "tools");
  assert.equal(pageDomain("/resume/resume-tailor"), "resume-builder");
  assert.equal(pageDomain("/node-based-flow"), "node-based-builder");
  assert.equal(pageDomain("/finance-tracker/private-id"), "finance-tracker");
  assert.equal(pageDomain("/private-id"), "application");
});

test("local instrumentation exports real spans and safe errors without a Sentry network transport", async () => {
  const transactions: Sentry.Event[] = [];
  const errors: Sentry.Event[] = [];
  Sentry.init({
    dsn: "https://local@localhost/1",
    tracesSampleRate: 1,
    defaultIntegrations: false,
    transport: localTransport,
    beforeSendTransaction: (event) => {
      transactions.push(event);
      return event;
    },
    beforeSend: (event) => {
      errors.push(event);
      return event;
    },
  });
  mock.method(console, "info", () => {});
  mock.method(console, "error", () => {});
  try {
    assert.equal(
      await observeOperation("resume-builder.pdf-render", async () => 42),
      42,
    );
    const error = new Error("private resume content");
    await assert.rejects(
      observeOperation("dashboard.load", () =>
        observeOperation("chatbot.get", async () => {
          throw error;
        }),
      ),
      (thrown) => thrown === error,
    );
    await Sentry.flush(2000);
    assert.ok(
      transactions.some(
        (event) => event.contexts?.trace?.op === "resume-builder.pdf-render",
      ),
    );
    assert.equal(
      errors.length,
      1,
      "nested operations must not duplicate the error issue",
    );
    assert.equal(
      JSON.stringify(errors).includes("private resume content"),
      false,
    );
    assert.ok(errors[0].exception?.values?.[0].stacktrace?.frames?.length);
  } finally {
    mock.restoreAll();
    await Sentry.close();
  }
});

test("API failure responses and request options remain unchanged; aborts are warnings", async () => {
  const logs = mock.method(Sentry.logger, "warn", () => {});
  mock.method(console, "warn", () => {});
  mock.method(console, "info", () => {});
  const response = new Response("private response", { status: 422 });
  const fetchMock = mock.method(globalThis, "fetch", async () => response);
  try {
    const init = {
      method: "POST",
      body: "private payload",
      credentials: "include" as const,
    };
    assert.equal(
      await apiFetch(
        "http://localhost:3001/finance-tracker/transactions",
        init,
      ),
      response,
    );
    assert.equal(fetchMock.mock.calls[0].arguments[1], init);
    assert.equal(
      logs.mock.calls[0].arguments[0],
      "finance-tracker.post.rejected",
    );
    const abort = new DOMException("cancelled", "AbortError");
    fetchMock.mock.mockImplementation(async () => {
      throw abort;
    });
    await assert.rejects(
      apiFetch("http://localhost:3001/chatbot"),
      (error) => error === abort,
    );
    assert.equal(logs.mock.calls[1].arguments[0], "chatbot.get.cancelled");
  } finally {
    mock.restoreAll();
  }
});
