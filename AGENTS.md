<!-- BEGIN:nextjs-agent-rules -->
# Quinchool

Quinchool is Quinch's personal toolkit. This monorepo has three apps:

- `apps/web`: Next.js UI
- `apps/api`: NestJS auth, API, and database
- `apps/ai`: FastAPI LLM, RAG, and scraping work

Requests flow `web -> api -> ai`. Production runs on Cloud Run.
<!-- END:nextjs-agent-rules -->

## App boundaries

- `apps/web`: pure frontend. No Next.js API route handlers — it only calls `apps/api`. Never calls `apps/ai` directly.
- `apps/api`: orchestrator. Owns auth and the database. Delegates AI/RAG/scraping work to `apps/ai` — it never performs that work itself.
- `apps/ai`: owns all LLM, RAG, and scraping logic. Only `apps/api` calls it.

Each app has its own `AGENTS.md` with its file/folder conventions — check `apps/web/AGENTS.md`, `apps/api/AGENTS.md`, or `apps/ai/AGENTS.md` when working inside that app.

## Tooling

- Use pnpm only. Install from the repo root; add app dependencies with `pnpm --filter @quinchool/<app> add <package>`.
- `apps/web` uses Vite+ (`vp`) for lint, fmt, check, and test; Next.js still owns dev and build. Config lives in `apps/web/vite.config.ts`.
- Never run `vp fmt` or `vp check --fix` without explicit file paths.

## Deployment

- Deploys run from GitHub Actions to Cloud Run.
- Store production secrets in Google Secret Manager. Store non-secret deploy settings in GitHub Actions variables. Local `.env` files are for local development only.

## Git

- Never push without the user's explicit request in the current chat.
