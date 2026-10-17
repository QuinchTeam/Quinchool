# Web logging audit

Baseline: commit `7d1d494`. Scope: existing `apps/web` logging, Sentry,
and error handling. GCP is the primary observability destination; Sentry is
retained for detailed error diagnostics, replay and feedback.

## Existing telemetry

| Surface | Existing behavior | Migration scope |
| --- | --- | --- |
| `src/features/resume-builder/components/resume-pdf-preview.tsx` | One runtime `console.error` on PDF generation failure; retains a retry UI | Migrate this existing log, preserving the fallback |
| `scripts/check-tailwind-arbitrary.mjs` | Four `console.error` call sites and one `console.log` for CLI diagnostics | Retain terminal output and exit behavior; these are build tooling, not app telemetry |
| Shared logging | No application logger utility or explicit Sentry logger calls | No existing logger to migrate |
| `src/instrumentation-client.ts` | Production Sentry initialization, 10% traces, replay (10% sessions, all error sessions), logs enabled, router transition hook | Preserve existing browser errors, tracing, replay, and navigation coverage |
| `sentry.server.config.ts` | Production Sentry initialization, 10% traces, logs enabled; filters aborted ECONNRESET errors | Preserve filtering and server error coverage |
| `sentry.edge.config.ts` | Production Sentry initialization, 10% traces, logs enabled | Preserve edge coverage |
| `src/instrumentation.ts` | Loads production runtime configs; forwards server request errors to Sentry; development uncaught-exception callback suppresses aborted ECONNRESET and rethrows other failures | Preserve runtime hooks and development behavior |
| `next.config.ts`, `Dockerfile` | Production Sentry build integration, source-map upload credentials, `/sentry-tunnel` | Account for build and transport configuration in any replacement |
| `src/components/shared/sentry-feedback-button.tsx` | Production feedback widget loaded lazily; resets opening state in `finally` | Preserve user bug reporting; it is not a logging call |

At the baseline, `enableLogs: true` enabled the Sentry log pipeline but did not itself migrate
console output. There are no explicit `captureException`, `captureMessage`,
`startSpan`, or `tracePropagationTargets` uses in application source.
There are no app-defined `error.tsx` or `global-error.tsx` boundaries.
OpenTelemetry packages are installed in web, but application source has no
OpenTelemetry initialization or exporter usage.

## Existing error handling

| Area | Existing handling |
| --- | --- |
| Auth and profile | Better Auth result errors become toasts; missing reset tokens are handled locally |
| Career profile, resume tailoring, jobs scraper, finance, chatbot | Request helpers throw API/network failures; React Query stores failures; consumers show toasts, retry controls, or inline errors |
| React Query provider | Plain QueryClient; no global query or mutation error reporting |
| Finance forms | Catches retain form values and rely on mutation error state; wallet deletion rolls back optimistic state; delete/sign-out dialogs display caught failures |
| Text generation and node builder | Mutation failures displayed inline; canvas catches per-node failures and stores `executionError`, including local missing-prompt validation |
| Resume PDF | Caught generation failure logs to console and switches preview to retry UI |
| Dashboard server loading | Non-OK responses and caught network/JSON failures return `null`, displaying unavailable tiles |
| Finance server loading | Caught overview failures render unavailable UI; transaction prefetch uses React Query's prefetch behavior |
| Parsing fallbacks | API error-body JSON parsing falls back to null; resume JSON extraction returns null on invalid JSON |
| Feedback | No catch; rejected widget loading propagates, with opening state reset in finally |

Handled failures above have no explicit telemetry calls, apart from the PDF
console log. Adding capture to them would expand coverage; it is a separate
step from migrating existing telemetry. Preserve expected validation, session
expiry, cancellation, rollback, and UI fallback behavior during migration.

## First migration

The following two sections record the migration baseline; the domain-coverage
extension below supersedes their signed-out and handled-error limitations.

- PDF generation failures use a shared logger: production structured Sentry
  logs contain the existing message and error type; development retains the
  original console diagnostic. Resume content and raw error values are not
  added to production log attributes.
- Browser and Node Sentry tracing propagate W3C `traceparent` only to the
  configured API base, joining the existing API/AI OpenTelemetry context.
- Node Sentry uses its own existing OpenTelemetry provider with an additional
  OTLP span processor when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured. A second
  provider is not registered. Browser export remains through Sentry.
- Existing sampling, error filtering, replay, feedback, CLI output, and UI
  error handling are retained. No new metrics or handled-error capture is added.

## GCP migration

Existing Sentry errors and logs now also produce bounded GCP summaries.
Production browser sampled transactions export their original span/parent IDs
and timing through the API as OTLP JSON. The API receiver requires a valid
session, validates payloads and limits ingestion. Signed-out/expired-session
browser events remain Sentry-only. Node spans export through Sentry's existing
provider; Node/Edge event summaries use Cloud Run stdout logging.

The deployment workflow adds a Google collector sidecar to web, API and AI.
Existing service stdout and Cloud Run platform metrics already reach GCP and
retain that transport. No custom metrics or additional error handlers are
introduced. No replay, feedback, prompt, resume or arbitrary request payload is
copied to GCP by the web relay. Existing API/AI log content is unchanged.

See [observability setup](observability.md) for IAM prerequisites, validation,
billing changes, query instructions and deployment limitations.

## Domain-coverage extension

All application fetch sites now use the shared `apiFetch` boundary; telemetry
delivery itself deliberately uses plain fetch to avoid recursion. Better Auth
uses that same boundary through `customFetchImpl`. Shared feature request
helpers instrument parsing and preserve their existing response/error behavior.
Dashboard, resume tailoring/PDF rendering/download, and node-flow/node execution
also have explicit operation spans. Root/global error boundaries capture render
failures with recovery UI. The link-only tools hub has navigation coverage,
not fabricated business events.

Logs include starts, completions, rejections, cancellation and failures.
Expected 4xx errors are warnings; unexpected/network/server failures also
produce safe Sentry issues. Production Sentry transport and replay remain;
development instrumentation uses a no-network transport while exporting to
the local shared collector. Anonymous delivery uses the bounded public relay
and is marked untrusted. Full domain coverage, privacy rules and delivery
limits are listed in [observability setup](observability.md#featuredomain-coverage).

## OpenTelemetry-first logging

OpenTelemetry is now the only destination for web logs and traces. The shared
logger exports OTLP records directly instead of going through `Sentry.logger`,
and `enableLogs` is off in every runtime. Sentry still samples spans, but
transactions are dropped before sending; browser transactions go only to the
API relay, and edge records no traces. Sentry receives captured errors, error
replays and feedback only; session replays without an error are no longer recorded.
