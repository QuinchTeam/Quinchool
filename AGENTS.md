# About

Quinchool is my personal all-in-one toolkit app, we build anything here that helps me on my life and work, I'm building solo here. This monorepo has three apps:

- `apps/web`: Next.js, I keep this frontend only. No API route handlers or Server actions, it only calls `apps/api` and also never calls `apps/ai` directly.
- `apps/api`: NestJS, Its the central backend service app, the orchestrator. Owns auth, sockets, jobs, and the database. Delegates any AI/ML/RAG/Scraping works to `apps/ai` — it never performs that work here.
- `apps/ai`: FastAPI, This is my specialized service app, it owns all AI, Machine Learning, RAG, and Scraping logic. Only `apps/api` calls it.

My flow is linear: `web -> api -> ai` or just `web -> api`.

Each app has its own `AGENTS.md` which contains all info you need when working inside those apps. Check it on `apps/web/AGENTS.md`, `apps/api/AGENTS.md`, or `apps/ai/AGENTS.md`.

## AI Assistant Guide for coding and development

- We keep things Simple, use `ponytail` so we dont overengineer the code or overcomplicate our ideas.
- Use `i-have-adhd` and `caveman` when replying to me, I want dead-simple answer, and straight to the point. Do not give long lecture everytime you reply.
- We use pnpm. We work from the repo root; add app dependencies with `pnpm --filter @quinchool/<app> add <package>`.
- Do not run formatting, lint, Tailwind conventions, secret scans, type checks, tests, or builds after every code change. Pre-commit handles staged formatting, lint, Tailwind conventions, and secret scans. Run type checks, tests, and builds only when committing and pushing, or when explicitly requested.

## Infrastructure, Outside, and Deployment

- Infrastructure is code in `infra/terraform/` (GCP + GitHub Actions variables). Change infra there, never by hand; see `docs/architecture/deployment.md`.
- Deploys run from GitHub Actions to Cloud Run. Production runs on Cloud Run; local apps run through `pnpm dev`, and local infrastructure runs in Docker. We don't have staging or previews; we push straight to main by default, creating PRs only for learning or when requested.
- Production secrets is in Google Secret Manager and Non-secret deploy settings is in GitHub Actions variables. The Local `.env` files are for local development only.
- Production datas are stored on our production NeonDB and Cache data on Redis Upstash (TBA). For file uploads, it is store on Cloudflare R2 (TBA). Locally we use Docker PostgreSQL, Redis (TBA) and Garage (TBA).
- Production logs use Cloud Logging, traces use Cloud Trace, and metrics use Cloud Monitoring. Sentry handles detailed errors and replays; Langfuse handles LLM observations. Locally, the Docker OpenTelemetry Collector prints telemetry to Docker logs, and errors appear in console/Docker logs without being sent to Sentry.
