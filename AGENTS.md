<!-- BEGIN:nextjs-agent-rules -->
# Quinchool

Quinchool is Quinch's personal toolkit. This monorepo has three apps:

- `apps/web`: Next.js UI
- `apps/api`: NestJS auth, API, and database
- `apps/ai`: FastAPI LLM, RAG, and scraping work

Requests flow `web -> api -> ai`. Production runs on Cloud Run.
<!-- END:nextjs-agent-rules -->

## Web

- Read relevant `node_modules/next/dist/docs/` guides before changing Next.js code.
- Put React components in `apps/web/src/components/`. Keep `apps/web/src/app/` for routes and Next.js conventions only.
- Use Tailwind theme tokens. Do not add arbitrary values or properties. Arbitrary variants are allowed. Add missing tokens in `apps/web/src/app/globals.css`.
- Run `pnpm lint:tailwind` after Tailwind changes. Use `tailwind-allow-arbitrary` only for a justified same-line exception.

## Tooling

- Use pnpm only. Install from the repo root; add app dependencies with `pnpm --filter @quinchool/<app> add <package>`.
- Never run `pnpm format` or `biome format --write` without explicit file paths.

## Deployment

- Deploys run from GitHub Actions to Cloud Run.
- Store production secrets in Google Secret Manager. Store non-secret deploy settings in GitHub Actions variables. Local `.env` files are for local development only.

## Git

- Never push without the user's explicit request in the current chat.
