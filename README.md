# Quinchool

Quinchool is Quinch's personal all-in-one toolkit, bringing together the
essential tools Quinch needs every day.

## Apps

| Path       | Stack   | Port |
| ---------- | ------- | ---- |
| `apps/web` | Next.js | 3000 |
| `apps/api` | NestJS  | 3001 |
| `apps/ai`  | FastAPI | 8000 |

`apps/ai` handles LLM, RAG, and scraping work.

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

`apps/web` renders the UI. `apps/api` owns auth and the database. `apps/ai`
handles stateless AI work. The request path is `web -> api -> ai`.

| File            | Variable              | Purpose          |
| --------------- | --------------------- | ---------------- |
| `apps/web/.env` | `NEXT_PUBLIC_API_URL` | API URL          |
| `apps/api/.env` | `AI_SERVICE_URL`      | AI service URL   |
| `apps/api/.env` | `WEB_ORIGIN`          | CORS origin      |
| `apps/ai/.env`  | `GEMINI_API_KEY`      | Gemini API key   |

## Tailwind CSS

Use Tailwind theme tokens. Do not use arbitrary values or properties. Add a
missing token to `apps/web/src/app/globals.css`.

```bash
pnpm lint:tailwind
pnpm test:tailwind
```

The check runs before commits and in CI. For a justified exception, add
`tailwind-allow-arbitrary` on the same line.
