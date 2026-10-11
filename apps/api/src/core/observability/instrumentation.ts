import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { NodeSDK } from "@opentelemetry/sdk-node";

try {
  process.loadEnvFile();
} catch {
  // Deployment supplies environment variables directly.
}

export const telemetrySdk = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  ? new NodeSDK({
      serviceName: "quinchool-api",
      autoDetectResources: false,
      metricReaders: [],
      logRecordProcessors: [],
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [new HttpInstrumentation(), new UndiciInstrumentation()],
    })
  : undefined;

if (telemetrySdk) {
  telemetrySdk.start();
  process.once("beforeExit", () => void telemetrySdk.shutdown());
}
