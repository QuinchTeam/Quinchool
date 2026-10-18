# Web (Next.js)

- Pure frontend. No Next.js API route handlers — all backend calls go to `apps/api`, never `apps/ai`.
- Read relevant `node_modules/next/dist/docs/` guides before changing Next.js code.
- Feature-based structure: each feature lives under `src/features/<feature>/`, with its own `components/`, `hooks/`, `lib/`, and `validations/` subfolders as needed. Keep `src/app/` for routes and Next.js conventions only. `src/components/`, `src/hooks/`, and `src/lib/` hold cross-feature shared code only.
- Use Tailwind theme tokens. Do not add arbitrary values or properties. Arbitrary variants are allowed. Add missing tokens in `apps/web/src/app/globals.css`.
- Run `pnpm lint:tailwind` after Tailwind changes. Use `tailwind-allow-arbitrary` only for a justified same-line exception.

Use Phosphor icons with individual imports from `@phosphor-icons/react/dist/ssr/<IconName>` and the shared `AppIcon` component in `src/components/ui/icon.tsx`. Icons must always use duotone; do not use regular, outline, filled, or other weights. Apply this rule to newly generated shadcn components too. Exceptions: the dialog close button in `src/components/ui/dialog.tsx` and the history "Clear filters" button use a regular-weight `XIcon`; the pagination ellipsis in `src/components/ui/pagination.tsx` uses a regular-weight `DotsThreeIcon`.

## Tests

Tests live in a dedicated `tests/` folder at the same level as `src/`. The `tests/src/` tree mirrors `src/` exactly (`tests/src/features/<feature>/...`), containing only test files.
