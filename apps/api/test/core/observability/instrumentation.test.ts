import * as assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { test } from "node:test";

test("HTTP requests propagate their trace through Node fetch", async () => {
  const { createServer: createTcpServer } = await import("node:net");
  const reservation = createTcpServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const exportPort = (reservation.address() as AddressInfo).port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT = `http://127.0.0.1:${exportPort}`;
  const { telemetrySdk } = await import(
    "../../../src/core/observability/instrumentation"
  );
  const { requestTelemetry } = await import(
    "../../../src/core/observability/request"
  );
  // Load HTTP after instrumentation, just as main.ts loads Nest afterwards.
  const { createServer } = await import("node:http");
  let exports = 0;
  const signals = new Set<string>();
  const exportedData: string[] = [];
  const collector = createServer((request, response) => {
    signals.add(request.url ?? "");
    request.on("data", (chunk: Buffer) =>
      exportedData.push(chunk.toString("utf8")),
    );
    request.resume();
    request.on("end", () => {
      exports += 1;
      response.setHeader("Content-Type", "application/json");
      response.end("{}");
    });
  });
  collector.listen(exportPort, "127.0.0.1");
  await once(collector, "listening");
  let propagated = "";
  const ai = createServer((request, response) => {
    propagated = String(request.headers.traceparent);
    response.end("ok");
  });
  ai.listen(0, "127.0.0.1");
  await once(ai, "listening");
  const api = createServer((request, response) =>
    requestTelemetry(
      Object.assign(request, {
        path: "/career-profile",
      }) as unknown as import("express").Request,
      response as unknown as import("express").Response,
      () => {
        void (async () => {
          await fetch(
            `http://127.0.0.1:${(ai.address() as AddressInfo).port}/health?token=private-telemetry-test`,
          );
          response.end("ok");
        })();
      },
    ),
  );
  api.listen(0, "127.0.0.1");
  await once(api, "listening");
  try {
    // The uninstrumented test client must not replace the supplied parent.
    const { execFile } = await import("node:child_process");
    await new Promise<void>((resolve, reject) => {
      execFile(
        process.execPath,
        [
          "-e",
          `fetch('http://127.0.0.1:${(api.address() as AddressInfo).port}', {headers: {traceparent: '00-11111111111111111111111111111111-2222222222222222-01'}}).then(r => r.text())`,
        ],
        (error) => (error ? reject(error) : resolve()),
      );
    });
    assert.match(
      propagated,
      /^00-11111111111111111111111111111111-[a-f0-9]{16}-01$/,
    );
  } finally {
    api.closeAllConnections();
    ai.closeAllConnections();
    api.close();
    ai.close();
    await telemetrySdk?.shutdown();
    collector.closeAllConnections();
    collector.close();
    assert.ok(exports > 0, "completed spans reach the OTLP exporter");
    assert.ok(signals.has("/v1/traces"));
    assert.ok(
      signals.has("/v1/logs"),
      "domain logs reach the same OTLP collector",
    );
    assert.equal(
      exportedData.join("").includes("private-telemetry-test"),
      false,
    );
  }
});
