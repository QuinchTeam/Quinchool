# Quinchool

Quinchool is my personal toolkit app, I can build anything here that helps me on my life and work. This monorepo has three apps:

- `apps/web`: Next.js, I keep this frontend only, and build the design here.
- `apps/api`: NestJS, my central backend, I keep auth, APIs, database querying and, calling AI here.
- `apps/ai`: FastAPI, this is my specialized service app, I commonly put AI, LLM, RAG, and Scraping works here.

Visualization how my app flows: `web -> api -> ai`.

## App boundaries

- `apps/web`: pure frontend. No Next.js API route handlers — it only calls `apps/api`. Never calls `apps/ai` directly.
- `apps/api`: orchestrator. Owns auth and the database. Delegates AI/RAG/scraping work to `apps/ai` — it never performs that work itself.
- `apps/ai`: owns all LLM, RAG, and scraping logic. Only `apps/api` calls it.

Each app has its own `AGENTS.md` with its file/folder conventions — check `apps/web/AGENTS.md`, `apps/api/AGENTS.md`, or `apps/ai/AGENTS.md` when working inside that app.

## Tooling

- Use pnpm only. Install from the repo root; add app dependencies with `pnpm --filter @quinchool/<app> add <package>`.
- Vite+ (`vp`) config for shared lint, fmt, check, and staged checks lives in the root `vite.config.ts`; `apps/web/vite.config.ts` holds web-specific configuration. Next.js still owns web dev and build.
- Never run `vp fmt` or `vp check --fix` without explicit file paths.

## Deployment

- Do not run formatting, lint, Tailwind conventions, secret scans, type checks, tests, or builds after every code change. Pre-commit handles staged formatting, lint, Tailwind conventions, and secret scans; run type checks, tests, and builds only when committing and pushing, or when explicitly requested.
- Deploys run from GitHub Actions to Cloud Run. Production runs on Cloud Run, and Local uses Docker. We dont have staging or previews, we push straight to main as default, optionally creating PRs only for learning purposes or If I want/specify to.
- Production secrets is in Google Secret Manager and Non-secret deploy settings is in GitHub Actions variables. The Local `.env` files are for local development only.
