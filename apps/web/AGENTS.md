# Web (Next.js)

- Pure frontend. No Next.js API route handlers — all backend calls go to `apps/api`, never `apps/ai`.
- Read relevant `node_modules/next/dist/docs/` guides before changing Next.js code.
- Feature-based structure: each feature lives under `src/features/<feature>/`, with its own `components/`, `hooks/`, `lib/`, and `validations/` subfolders as needed. Keep `src/app/` for routes and Next.js conventions only. `src/components/`, `src/hooks/`, and `src/lib/` hold cross-feature shared code only.
- Use Tailwind theme tokens. Do not add arbitrary values or properties. Arbitrary variants are allowed. Add missing tokens in `apps/web/src/app/globals.css`.
- Run `pnpm lint:tailwind` after Tailwind changes. Use `tailwind-allow-arbitrary` only for a justified same-line exception.

## Tests

Tests live in a dedicated `tests/` folder at the same level as `src/`. The `tests/src/` tree mirrors `src/` exactly (`tests/src/features/<feature>/...`), containing only test files.
