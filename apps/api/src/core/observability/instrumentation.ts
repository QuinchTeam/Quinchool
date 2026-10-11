import { SafeTraceExporter } from "./trace-exporter";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { UndiciInstrumentation } from "@opentelemetry/instrumentation-undici";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";

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
      logRecordProcessors: [
        new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() }),
      ],
      traceExporter: new SafeTraceExporter(),
      instrumentations: [
        new HttpInstrumentation(),
        new UndiciInstrumentation(),
      ],
    })
  : undefined;

if (telemetrySdk) {
  telemetrySdk.start();
  process.once("beforeExit", () => void telemetrySdk.shutdown());
}
