# Quinchool

Monorepo. Each app keeps its own dependencies; the root only orchestrates.

| Path       | Stack   | Port |
| ---------- | ------- | ---- |
| `apps/web` | Next.js | 3000 |
| `apps/api` | NestJS  | 3001 |
| `apps/ai`  | FastAPI | 8000 |

`apps/ai` holds the LLM work — GenAI, RAG, scraping.

## Running from the root

```bash
pnpm install  # every workspace, one lockfile
pnpm infra    # Postgres + pgvector, crawl4ai (docker compose up -d)
pnpm dev      # all three apps, interleaved and colour-coded
```

One at a time: `pnpm dev:web`, `pnpm dev:api`, `pnpm dev:ai`.
Ctrl-C stops the whole `pnpm dev` group.

`apps/ai` needs its venv once:

```bash
cd apps/ai
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
```

The `dev:ai` script hardcodes the Windows venv path (`.venv\Scripts\python`).
On macOS or Linux change it to `.venv/bin/python`.

## How a request flows

NestJS owns auth and the database. The web app calls it, and NestJS delegates
stateless AI work to FastAPI. Each hop is one environment variable, all with
working localhost defaults:

| File            | Variable              | Points at        |
| --------------- | --------------------- | ---------------- |
| `apps/web/.env` | `NEXT_PUBLIC_API_URL` | `apps/api` :3001 |
| `apps/api/.env` | `AI_SERVICE_URL`      | `apps/ai` :8000  |
| `apps/api/.env` | `WEB_ORIGIN`          | CORS allowlist   |
| `apps/ai/.env`  | `GEMINI_API_KEY`      | Google AI Studio |

The jobs scraper is the worked example. The browser calls `/jobs-scraper` on
the API for all four verbs; `apps/web` only renders it. The API authenticates
the request against the better-auth session row, reads and writes every job
row itself, and delegates crawling and classification to `apps/ai`. The career
profile works the same way on `/career-profile`, minus the AI hop.

`apps/web` serves no API routes at all. The API owns every public endpoint, the
database, and better-auth itself: it mounts the auth handler on `/api/auth`, and
the web app keeps only the React client pointed at it.

FastAPI owns provider keys, model/provider fallback, prompts, and model-output
handling. It receives JSON from NestJS and performs no database calls.

That is also why `apps/web` has no `DATABASE_URL` and no Prisma client — the
schema generates one client now, for the API.

The session cookie is issued by the API and read by the web app's proxy for
optimistic route gating. On localhost the two share a host, so the cookie
reaches both. Splitting them across subdomains in production needs
`advanced.crossSubDomainCookies` in the better-auth config, or the proxy stops
seeing it.

Authentication crosses that hop on the session cookie the web app already set,
so the API enables CORS credentials and the browser sends them. Ports do not
make an origin cross-site, so the cookie's default `SameSite=Lax` is enough on
localhost and on two hosts under one domain. Serving them from unrelated
domains would need `SameSite=None`.

## Tailwind CSS

Use the project's Tailwind theme tokens instead of arbitrary values or properties.
Arbitrary variants such as `data-[state=open]:block` and `[&_svg]:size-4` remain
allowed. Add genuinely missing values to `@theme` in `apps/web/src/app/globals.css`.

```bash
pnpm lint:tailwind
pnpm test:tailwind
```

The guard runs against staged stylesheets, JavaScript, TypeScript, and MDX files
through the Husky pre-commit hook and against all first-party source in CI.
Generated shadcn primitives under `apps/web/src/components/ui` are excluded. For a rare
justified exception, add `tailwind-allow-arbitrary` in a comment on the same
line.
