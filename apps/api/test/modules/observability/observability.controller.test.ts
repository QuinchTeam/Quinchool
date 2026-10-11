import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { Global, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

test("web telemetry requires a valid session and validates the HTTP payload", async () => {
  process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET ??= "observability-test-secret";
  const { PrismaService } = await import("../../../src/core/database/prisma/prisma.service");
  const { ObservabilityModule } = await import("../../../src/modules/observability/observability.module");
  @Global()
  @Module({
    imports: [ObservabilityModule],
    providers: [{
      provide: PrismaService,
      useValue: { session: { findUnique: async ({ where }: { where: { token: string } }) =>
        where.token === "valid" ? { userId: "user", expiresAt: new Date(Date.now() + 60_000) } : null } },
    }],
    exports: [PrismaService],
  })
  class TestApp {}
  const app = await NestFactory.create(TestApp, { logger: false, abortOnError: false });
  const output = mock.method(console, "log", () => {});
  try {
    await app.listen(0, "127.0.0.1");
    const url = `${await app.getUrl()}/observability/web`;
    const request = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ kind: "error", message: "Web application error", severity: "ERROR" }]),
    };
    assert.equal((await fetch(url, request)).status, 401);
    const authenticated = { ...request, headers: { ...request.headers, cookie: "better-auth.session_token=valid.sig" } };
    assert.equal((await fetch(url, authenticated)).status, 204);
    assert.equal(output.mock.callCount(), 1);
    assert.equal((await fetch(url, { ...authenticated, body: JSON.stringify([{ kind: "error", headers: { authorization: "secret" } }]) })).status, 400);
    assert.equal((await fetch(url, { ...request, headers: { ...request.headers, cookie: "better-auth.session_token=expired.sig" } })).status, 401);
    const publicUrl = `${url}-public`;
    assert.equal((await fetch(publicUrl, request)).status, 403);
    assert.equal((await fetch(publicUrl, { ...request, headers: { ...request.headers, origin: "https://untrusted.example" } })).status, 403);
    const anonymous = { ...request, headers: { ...request.headers, origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" } };
    assert.equal((await fetch(publicUrl, anonymous)).status, 204);
    assert.equal(JSON.parse(output.mock.calls.at(-1)!.arguments[0]).authenticated, false);
    assert.equal((await fetch(publicUrl, { ...anonymous, body: JSON.stringify([{ kind: "error", message: "bad", severity: "ERROR", headers: { cookie: "secret" } }]) })).status, 400);
  } finally {
    await app.close();
    mock.restoreAll();
  }
});
