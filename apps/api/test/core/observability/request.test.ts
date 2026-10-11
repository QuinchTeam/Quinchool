import * as assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mock, test } from "node:test";
import type { Request, Response } from "express";
import { requestTelemetry } from "../../../src/core/observability/request";

test("every API domain, auth, status and cancellation is logged once without raw paths", () => {
  const output = mock.method(console, "log", () => {});
  try {
    for (const domain of [
      "career-profile",
      "build-resume",
      "chatbot",
      "finance-tracker",
      "jobs-scraper",
      "text-generation",
      "prompt-enhancer",
      "api",
    ]) {
      for (const status of [200, 422, 500, 499]) {
        const response = Object.assign(new EventEmitter(), {
          statusCode: status,
          writableFinished: status !== 499,
        });
        let called = false;
        requestTelemetry(
          { path: `/${domain}/private-id`, method: "POST" } as Request,
          response as unknown as Response,
          () => {
            called = true;
          },
        );
        assert.ok(called);
        response.emit(status === 499 ? "close" : "finish");
        response.emit("close");
        const record = JSON.parse(output.mock.calls.at(-1)!.arguments[0]);
        assert.equal(record.domain, domain === "api" ? "auth" : domain === "build-resume" ? "resume-builder" : domain);
        assert.equal(record.status, status);
        assert.equal(
          record.severity,
          status >= 500 ? "ERROR" : status >= 400 ? "WARNING" : "INFO",
        );
      }
    }
    assert.equal(output.mock.callCount(), 64);
    assert.equal(
      JSON.stringify(output.mock.calls).includes("private-id"),
      false,
    );
    requestTelemetry(
      { path: "/observability/web", method: "POST" } as Request,
      {} as Response,
      () => {},
    );
    assert.equal(output.mock.callCount(), 64);
  } finally {
    mock.restoreAll();
  }
});
