# Observability

## Existing coverage

- Web: domain requests and local workflows produce logs, spans and error summaries; Sentry retains production diagnostics and replay.
- API/AI: domain operations and request outcomes export correlated OTLP logs and traces when the collector endpoint is configured.
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

Commit `7d1d494` originally added request traces only. The domain instrumentation
below extends that baseline without copying application payloads into GCP.

## Web migration: GCP with Sentry retained

Production browser and Node Sentry tracing now sends W3C `traceparent` to
`NEXT_PUBLIC_API_URL` (default `http://localhost:3001`). API OpenTelemetry
extracts this context and propagates it to AI. The API's existing CORS
configuration reflects requested headers, including tracing headers.

When `OTEL_EXPORTER_OTLP_ENDPOINT` is configured, production web Node spans
also export through an additional processor on Sentry's existing OpenTelemetry
provider. Browser errors, replay, feedback, and browser traces retain their
production Sentry transport. Development uses Sentry instrumentation with a
local no-network transport: relay hooks still run, but nothing goes to Sentry.
Development traces are sampled at 100%; production remains at 10%.
The existing 10% web trace sampling remains in place, so this does not promise
every request will appear in a trace.

The existing PDF failure log now uses structured Sentry logging in production
and console output in development. Build-tool CLI diagnostics remain terminal
output. See [the web logging audit](web-logging-audit.md) for existing coverage
and handled-error behavior.

Sentry's error and log hooks mirror small summaries to the shared collector.
Node/Edge summaries use OTLP logs when the endpoint is configured, with
structured stdout when it is absent.
Browsers send summaries and sampled transaction spans to the session-protected
`POST /observability/web` API endpoint. It validates IDs, lengths, times and
batch size, limits ingestion per user and instance, and forwards logs and spans as OTLP
JSON to its local collector. It never accepts an exporter destination from the
browser. Delivery is best effort and does not block Sentry reporting or UI
error handling. A 401 retries `POST /observability/web-public`, which requires
the configured web Origin and limits anonymous ingestion to 20 batches per
minute per socket address. Authenticated ingestion allows 120 batches per
minute per user. Both cap batches at 50 records and active quota keys at 1000.
Origin is not authentication: anonymous records have
`app.telemetry.authenticated=false` and must not be treated as trusted audit
events. Proxy/NAT users can share the anonymous quota; multi-instance quotas
are not globally coordinated. Delivery remains best effort, including unload
and collector/network failures.
All browser records remain client-supplied, including authenticated ones;
neither relay is a trusted audit trail.

GCP error summaries contain a generic message, exception type, Sentry event ID and trace/span
IDs when available. Full exceptions, stack traces, replay, feedback and source
maps remain in Sentry. Trace summaries retain timing, operation, status, parent and
span IDs, and deliberately omit URLs, request headers, arbitrary span
attributes and descriptions. Existing structured log messages are bounded to
512 characters; raw exception values are not included.

The deployment workflow builds a pinned Google collector sidecar for each
service. Its OTLP receiver is loopback-only. It exports to the GCP Telemetry
API using the existing runtime service account, detects GCP resource labels,
and sets the project/quota project from `GCP_PROJECT_ID`. App containers depend
on the collector's startup probe. The collector config is non-secret and baked
into its image; no credential keys are added to apps or browser bundles.

API domain logs, existing Nest logs and AI `log_event` calls now use OTLP logs
when configured, otherwise structured console output. Safe event names,
counts, timing and exception types are retained; provider messages, prompts,
resumes, document contents and financial payloads are omitted. Development
password-reset links remain local console diagnostics only and are never
exported; production reports an unconfigured-delivery warning instead.
Infrastructure trace exporters also strip URLs, query strings, arbitrary
attributes and raw exception messages/stacks without changing Sentry's spans.
Langfuse retains its separate payload-bearing exporter. Infrastructure logs
inside Langfuse observations link to the enclosing infrastructure span.

Existing Cloud Run platform metrics provide requests, latency, CPU and memory
coverage. No custom metrics or alerts are added. The collector accepts OTLP
logs, traces and metrics.

### Feature/domain coverage

Every Nest feature controller gets a named handler span plus operation
start/completion/failure logs. Request middleware additionally covers guards,
validation, auth and aborted requests. Expected HTTP 4xx responses and
cancellations are warnings; server/unexpected failures are errors. Existing
responses, validation and UI fallback handling remain in place.
Instrumentation follows business/request boundaries, not every render,
keystroke, pure helper or SQL query.

| Domain | Web coverage | API / AI coverage |
| --- | --- | --- |
| Auth / profile | Better Auth custom fetch; profile updates labeled separately | Raw auth handler request lifecycle and safe library logs |
| Dashboard | Aggregate loading and individual tile operations, including fallback failures | Underlying finance, jobs and career handlers |
| Career profile | Load/save request and response parsing | All career handlers; chatbot tool reads/writes |
| Resume builder | Tailoring loop, PDF rendering and PDF download | Resume handler; AI tailoring, generation and repair attempts |
| Chatbot | Chat CRUD, messages and confirmed/dismissed actions | All handlers; tool read/prepare/write; AI respond, summary and title |
| Finance tracker | Overview, history, wallets, transactions, transfers, labels and parsing | Every finance handler, including chatbot-triggered operations |
| Jobs scraper | Config, scan, state and classification requests | All jobs handlers; AI scan, document collection, crawl and classification |
| Node builder / text generation | Flow execution, each node, enhancement and generation | Generation/enhancement handlers; AI operations and provider attempts/fallbacks |
| Tools hub / application | Navigation tracing; root and global render-error boundaries | No separate business operation in the link-only tools hub |

Unexpected handled web failures produce a safe Sentry exception preserving
the original stack frames, with raw error text removed. Reusing the same Error
across nested operations reports one issue. HTTP failures can also have distinct
request-layer and domain-layer diagnostics. Expected rejection/cancellation
does not create a new Sentry issue. Automatic Sentry capture remains enabled.

### Production prerequisites

Before deploying this workflow, enable the APIs and grant the runtime service
account the Telemetry writer and quota-consumer roles. Use the existing
`GCP_PROJECT_ID` and `GCP_RUNTIME_SERVICE_ACCOUNT` GitHub variables:

```sh
gcloud services enable telemetry.googleapis.com logging.googleapis.com monitoring.googleapis.com cloudtrace.googleapis.com --project PROJECT_ID
gcloud projects add-iam-policy-binding PROJECT_ID --member serviceAccount:RUNTIME_SERVICE_ACCOUNT --role roles/telemetry.writer
gcloud projects add-iam-policy-binding PROJECT_ID --member serviceAccount:RUNTIME_SERVICE_ACCOUNT --role roles/serviceusage.serviceUsageConsumer
```

Cloud Run uses instance-based CPU allocation (`--no-cpu-throttling`) so batched
exports can finish outside request handling. Each sidecar reserves 1 CPU and
128 MiB; this changes runtime billing. The workflow retains existing app
container names when adding sidecars. Roll back the Cloud Run revision to
restore the previous deployment; Sentry retention is unchanged.

Local development retains console diagnostics and additionally exports domain
telemetry to the existing collector. Set `OTEL_EXPORTER_OTLP_ENDPOINT` before
starting `pnpm dev` to include web Node, API and AI. Browser events relay through
the API; no collector endpoint or GCP credential is exposed to the browser. To
validate the GCP collector without sending telemetry:

```sh
docker build --file infra/otel-collector/Dockerfile --tag quinchool-otel-validation .
docker run --rm -e GOOGLE_CLOUD_PROJECT=validation-project quinchool-otel-validation validate --config=/etc/otelcol-google/config.yaml
```

### Inspect production telemetry

1. In Logs Explorer, filter `labels."app.domain"="finance-tracker"` for domain
   events, or `severity>=WARNING` for rejections and failures. OTLP string
   bodies appear as `textPayload`, attributes as labels, and resource metadata
   under `otel`. Native stdout fallback uses `jsonPayload` instead.
2. Follow the log's trace link to Cloud Trace. The original browser span IDs
   connect browser requests to the existing API/AI trace context.
3. Search the Sentry project for `labels."sentry.event_id"` from the OTLP error record
   for detailed exception diagnostics.
4. Use Cloud Monitoring's Cloud Run metrics for existing platform measurements.

Production ingestion and IAM must be checked after deployment; local tests
cannot prove permissions or GCP delivery. GCP error summaries are log records,
not a migration into Cloud Error Reporting's stack-based issue grouping.

Reference: [OpenTelemetry Docker installation](https://opentelemetry.io/docs/collector/install/docker/).
GCP references: [collector on Cloud Run](https://docs.cloud.google.com/stackdriver/docs/instrumentation/opentelemetry-collector-cloud-run),
[Telemetry API authentication](https://docs.cloud.google.com/stackdriver/docs/reference/telemetry/overview),
[Cloud Run logging](https://docs.cloud.google.com/run/docs/logging).
OTLP log query reference: [Google's OTLP-to-LogEntry mapping](https://docs.cloud.google.com/stackdriver/docs/reference/telemetry/otlp-log-record-to-log-entry).
