import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as Sentry from "@sentry/nextjs";
import { logError } from "../../../../src/lib/observability/logger.ts";

test("production logs omit raw error content; development keeps console diagnostics", () => {
  const originalEnvironment = process.env.NODE_ENV;
  const sentry = mock.method(Sentry.logger, "error", () => {});
  const consoleError = mock.method(console, "error", () => {});
  const error = new Error("private resume content");
  try {
    Object.assign(process.env, { NODE_ENV: "production" });
    logError("Could not generate the resume PDF", error);
    assert.deepEqual(sentry.mock.calls[0]?.arguments, [
      "Could not generate the resume PDF",
      { "error.type": "Error" },
    ]);
    assert.equal(consoleError.mock.callCount(), 0);

    Object.assign(process.env, { NODE_ENV: "development" });
    logError("Could not generate the resume PDF", error);
    assert.deepEqual(consoleError.mock.calls[0]?.arguments, [
      "Could not generate the resume PDF",
      error,
    ]);
    assert.equal(sentry.mock.callCount(), 2);
  } finally {
    if (originalEnvironment === undefined)
      Reflect.deleteProperty(process.env, "NODE_ENV");
    else Object.assign(process.env, { NODE_ENV: originalEnvironment });
    mock.restoreAll();
  }
});
