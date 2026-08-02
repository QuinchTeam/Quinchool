<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Component placement

Always place React components in `src/components/`, including components used by only one route. Do not create component files inside `src/app/`. Keep `src/app/` limited to Next.js route files and conventions such as `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `route.ts`.

Organize feature-specific components under an appropriate subdirectory, for example `src/components/resume-builder/build-resume.tsx`.

## Package manager

Use npm exclusively for installing dependencies and running package scripts. Do not use Bun, pnpm, or Yarn. Keep `package-lock.json` updated and do not create other package-manager lockfiles.

## Tailwind CSS: use design tokens, not arbitrary values

Style with the project's Tailwind theme tokens — never hard-coded arbitrary values in square brackets.

- Do **not** use arbitrary values: `w-[240px]`, `h-[420px]`, `text-[#1d4ed8]`, `gap-[7px]`, `text-[13px]`.
- Do **not** use arbitrary properties: `[mask-type:luminance]`, `[--custom-gap:7px]`.
- **Do** use scale/theme tokens: `w-60`, `h-96`, `text-primary`, `gap-2`, `text-sm`. If a value is genuinely missing, add it to the theme (`@theme` in `src/app/globals.css`) and use the generated token instead.
- Arbitrary **variants** are allowed and unaffected: `data-[state=open]:…`, `[&_svg]:…`, `supports-[backdrop-filter]:…`, `min-[900px]:…`.
- Vendored shadcn primitives under `src/components/ui/**` are exempt (generated code) and are not scanned — but don't introduce new arbitrary values when editing them either.

This is enforced automatically, so a violation will block the commit/CI:

- `npm run lint:tailwind` — the rule (`scripts/check-tailwind-arbitrary.mjs`); run it anytime.
- `npm run test:tailwind` — regression tests for the rule.
- a pre-commit hook (husky + lint-staged) runs it on staged files.
- CI runs it on every push/PR (`.github/workflows/ci.yml`).

For a rare, justified exception, add `tailwind-allow-arbitrary` in a comment on the same line to suppress the check.

## Git push safety

Never run `git push`, `git push --force`, `git push -f`, or `git push --force-with-lease` (or push to any remote in any other way) unless the user explicitly asks for it in the current chat message — even in bypass-permissions mode. Do not push automatically as part of "finishing" a task.

## Formatting

Never run `npm run format` (or `biome format --write`) with no path — it rewrites the whole repo. Pass only the files you changed.
