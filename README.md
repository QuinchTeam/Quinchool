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
npm install          # root: just concurrently
npm run install:all  # web + api dependencies
npm run infra        # Postgres + pgvector, crawl4ai (docker compose up -d)
npm run dev          # all three apps, interleaved and colour-coded
```

One at a time: `npm run dev:web`, `npm run dev:api`, `npm run dev:ai`.
Ctrl-C stops the whole `npm run dev` group.

`apps/ai` needs its venv once:

```bash
cd apps/ai
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt
```

The `dev:ai` script hardcodes the Windows venv path (`.venv\Scripts\python`).
On macOS or Linux change it to `.venv/bin/python`.

## Tailwind CSS

Use the project's Tailwind theme tokens instead of arbitrary values or properties.
Arbitrary variants such as `data-[state=open]:block` and `[&_svg]:size-4` remain
allowed. Add genuinely missing values to `@theme` in `apps/web/src/app/globals.css`.

```bash
npm run lint:tailwind
npm run test:tailwind
```

The guard runs against staged stylesheets, JavaScript, TypeScript, and MDX files
through the Husky pre-commit hook and against all first-party source in CI.
Generated shadcn primitives under `apps/web/src/components/ui` are excluded. For a rare
justified exception, add `tailwind-allow-arbitrary` in a comment on the same
line.
