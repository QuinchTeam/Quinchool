import { LangfuseSpanProcessor } from "@langfuse/otel";
import { setLangfuseTracerProvider } from "@langfuse/tracing";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

let isRegistered = false;

export function registerLangfuse() {
  if (isRegistered) {
    return;
  }

  isRegistered = true;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();

  const provider = new NodeTracerProvider({
    spanProcessors: publicKey && secretKey
      ? [
          new LangfuseSpanProcessor({
            baseUrl: process.env.LANGFUSE_BASE_URL,
            environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
            exportMode: "immediate",
            publicKey,
            secretKey,
          }),
        ]
      : [],
  });

  setLangfuseTracerProvider(provider);
}
