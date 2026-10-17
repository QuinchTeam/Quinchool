import * as assert from "node:assert/strict";
import { test } from "node:test";
import {
  type ArgumentsHost,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { ApiResponse } from "../../../src/core/http/api-response";
import { ApiExceptionFilter } from "../../../src/core/http/exception.filter";
import { ResponseInterceptor } from "../../../src/core/http/response.interceptor";

function render(exception: unknown) {
  const sent: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: unknown) {
      sent.body = body;
    },
  };
  new ApiExceptionFilter().catch(exception, {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost);
  return sent;
}

test("errors render as { error: { code, message } }", () => {
  assert.deepEqual(
    render(new NotFoundException({ code: "CHAT_NOT_FOUND", message: "Chat not found" })),
    { status: 404, body: { error: { code: "CHAT_NOT_FOUND", message: "Chat not found" } } },
  );
  assert.deepEqual(render(new ForbiddenException()).body, {
    error: { code: "FORBIDDEN", message: "Forbidden" },
  });
  assert.deepEqual(
    render(new NotFoundException({ code: "X", message: "m", meta: { scanId: "s1" } })).body,
    { error: { code: "X", message: "m" }, meta: { scanId: "s1" } },
  );
  const crash = render(new Error("db password leaked"));
  assert.equal(crash.status, 500);
  assert.doesNotMatch(JSON.stringify(crash.body), /password/);
});

test("success bodies are wrapped in { data }, 204s stay empty", async () => {
  const wrap = (value: unknown) =>
    lastValueFrom(
      new ResponseInterceptor().intercept(null as never, { handle: () => of(value) }),
    );
  assert.deepEqual(await wrap({ id: "1" }), { data: { id: "1" } });
  assert.deepEqual(await wrap(null), { data: null });
  assert.equal(await wrap(undefined), undefined);
  assert.deepEqual(await wrap(new ApiResponse([1], { nextCursor: null })), {
    data: [1],
    meta: { nextCursor: null },
  });
});
