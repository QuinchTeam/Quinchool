import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { BadRequestException, type ExecutionContext } from "@nestjs/common";
import { firstValueFrom, of, throwError } from "rxjs";
import { DomainInterceptor } from "../../../src/core/observability/domain.interceptor";
import { TelemetryLogger } from "../../../src/core/observability/logger";

test("domain operations preserve results/errors and distinguish validation from server failures", async () => {
  class FinanceTrackerController {}
  function transfer() {}
  const context = {
    getClass: () => FinanceTrackerController,
    getHandler: () => transfer,
  } as unknown as ExecutionContext;
  const output = mock.method(console, "log", () => {});
  try {
    const interceptor = new DomainInterceptor();
    const result = { amount: "private" };
    assert.equal(
      await firstValueFrom(
        interceptor.intercept(context, { handle: () => of(result) }),
      ),
      result,
    );
    for (const error of [
      new BadRequestException("private field"),
      new Error("private database credentials"),
    ]) {
      await assert.rejects(
        firstValueFrom(
          interceptor.intercept(context, {
            handle: () => throwError(() => error),
          }),
        ),
        (thrown) => thrown === error,
      );
    }
    const records = output.mock.calls.map((call) =>
      JSON.parse(call.arguments[0]),
    );
    assert.equal(records[1].event, "operation.completed");
    assert.equal(records[3].severity, "WARNING");
    assert.equal(records[5].severity, "ERROR");
    assert.equal(records[5].operation, "finance-tracker.transfer");
    assert.equal(JSON.stringify(records).includes("private"), false);
  } finally {
    mock.restoreAll();
  }
});

test("existing Nest logs keep safe event names and discard arbitrary message content", () => {
  const output = mock.method(console, "log", () => {});
  try {
    const logger = new TelemetryLogger();
    logger.warn("chat.tool.invalid-arguments", "ChatbotService");
    logger.error(
      "private provider response",
      "stack with secret",
      "ChatService",
    );
    assert.equal(
      JSON.parse(output.mock.calls[0].arguments[0]).event,
      "chat.tool.invalid-arguments",
    );
    assert.equal(JSON.stringify(output.mock.calls).includes("secret"), false);
    assert.equal(
      JSON.stringify(output.mock.calls).includes("private provider"),
      false,
    );
  } finally {
    mock.restoreAll();
  }
});
