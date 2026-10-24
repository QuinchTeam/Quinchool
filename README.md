# Quinchool

Quinchool is Quinch's personal all-in-one toolkit, bringing together the
essential tools Quinch needs every day.

## Apps

| Path       | Stack   | Port |
| ---------- | ------- | ---- |
| `apps/web` | Next.js | 3000 |
| `apps/api` | NestJS  | 3001 |
| `apps/ai`  | FastAPI | 8000 |

`apps/web` renders the UI. `apps/api` owns auth and the database. `apps/ai`
handles stateless LLM, RAG, and scraping work. The request path is
`web -> api -> ai`.

| File            | Variable              | Purpose        |
| --------------- | --------------------- | -------------- |
| `apps/web/.env` | `NEXT_PUBLIC_API_URL` | API URL        |
| `apps/api/.env` | `AI_SERVICE_URL`      | AI service URL |
| `apps/api/.env` | `WEB_ORIGIN`          | CORS origin    |
| `apps/ai/.env`  | `GEMINI_API_KEY`      | Gemini API key |

## Run

```bash
pnpm install
pnpm infra
pnpm dev
```

Run one app with `pnpm dev:web`, `pnpm dev:api`, or `pnpm dev:ai`.

Set up the AI virtual environment once:

```bash
cd apps/ai
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
```

On macOS or Linux, change `dev:ai` to use `.venv/bin/python`.

## Architecture

### Infra

| Area            | Tool                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Package manager | **pnpm 10** workspaces (`apps/web`, `apps/api`, `packages/*`)                                            |
| Hosting         | **Google Cloud Run**, one Docker image per app                                                           |
| IaC             | **Terraform** (`infra/terraform`): GCP + GitHub Actions variables, see `docs/architecture/deployment.md` |
| Database        | **Neon** (serverless Postgres)                                                                           |
| CI/CD           | **GitHub Actions** (`ci.yml`, `deploy.yml`)                                                              |
| Secrets         | **Google Secret Manager**; GitHub Actions variables for config                                           |
| Local services  | Docker Compose: **pgvector** (Postgres 17), **Crawl4AI**, OTel Collector                                 |
| Observability   | **OpenTelemetry** to the OTel Collector (`infra/otel-collector`)                                         |
| Git hooks       | **Husky**                                                                                                |

### Web (`apps/web`)

| Area          | Tool                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| Runtime       | **Node 22**                                                               |
| Framework     | **Next.js 16** + **React 19**, React Compiler                             |
| UI            | **shadcn/ui** + **Base UI**, **Tailwind CSS v4**, Phosphor (duotone only) |
| Data fetching | **TanStack Query**                                                        |
| Forms         | **React Hook Form** + **Zod**                                             |
| Auth          | **Better Auth** client                                                    |
| Extras        | React Flow (`@xyflow/react`), dnd-kit, React PDF                          |
| Errors        | **Sentry**                                                                |
| Tooling       | **Vite+**: Oxlint, Oxfmt, Vitest, type-check (`vite.config.ts`)           |

### API (`apps/api`)

| Area       | Tool                                                   |
| ---------- | ------------------------------------------------------ |
| Runtime    | **Node 22**                                            |
| Framework  | **NestJS 11** on Express 5                             |
| Database   | **Neon** (Postgres) + **Prisma 7** (`packages/prisma`) |
| Auth       | **Better Auth**                                        |
| Validation | **Zod**                                                |
| Tests      | `node:test`                                            |

### AI (`apps/ai`)

| Area        | Tool                          |
| ----------- | ----------------------------- |
| Runtime     | **Python 3.12**               |
| Framework   | **FastAPI** + Uvicorn         |
| Config      | **pydantic-settings**         |
| LLM         | **Gemini** via `google-genai` |
| LLM tracing | **Langfuse**                  |
| Scraping    | **Crawl4AI** service, `httpx` |
| Tests       | **pytest**                    |
