# Observability

## Existing coverage

- Web: Sentry captures errors, performance traces, session replay, and logs in production.
- AI: Langfuse records LLM observations when its credentials are configured.
- Cloud Run captures service stdout/stderr in Cloud Logging.

## Step 1: local OpenTelemetry Collector

The local collector accepts OTLP over HTTP at `http://localhost:4318`.
It batches logs, traces, and metrics and prints them to its Docker logs.
It does not store telemetry or provide a dashboard.

Start only the collector:

```powershell
docker compose up -d otel-collector
docker compose logs -f otel-collector
```

Validate its configuration:

```powershell
docker compose run --rm --no-deps otel-collector validate --config=/etc/otelcol/config.yaml
```

The HTTP receiver uses `/v1/traces`, `/v1/metrics`, and `/v1/logs`.
Its host port is bound to loopback because this local receiver has no authentication.
Detailed debug output is for local synthetic data only: do not send secrets,
prompts, resumes, or other private content.

## Step 2: API and AI request traces

Both apps enable tracing only when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured.
To enable local tracing for both processes in PowerShell:

```powershell
$env:OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4318"
pnpm dev
```

Restart existing app processes after setting the variable. Unset it to disable
this integration. NestJS loads instrumentation before its HTTP dependencies;
HTTP requests and outgoing Node fetch calls produce spans. FastAPI extracts
incoming W3C trace context and produces a server span under the same trace ID.
Services are named `quinchool-api` and `quinchool-ai`.

Langfuse uses a separate tracer provider when collector tracing is enabled.
It inherits active trace context but exports its AI observations only to
Langfuse, keeping prompts and outputs out of the collector. HTTP instrumentation
does not capture request bodies or headers by default. URL paths and query
strings can appear in spans: never put private content or tokens in URLs.

This step adds request traces only. Existing logs, metrics, browser Sentry,
and production deployment retain their current behavior.

## Next steps

1. Choose the production destination and configure Cloud Run deployment.
2. Connect frontend traces through the existing Sentry integration.

Reference: [OpenTelemetry Docker installation](https://opentelemetry.io/docs/collector/install/docker/).
