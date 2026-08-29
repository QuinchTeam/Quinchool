@AGENTS.md

## Component placement

Always place React components in `apps/web/src/components/`, including components used by only one route. Do not create component files inside `apps/web/src/app/`. Keep `apps/web/src/app/` limited to Next.js route files and conventions such as `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `route.ts`.

Organize feature-specific components under an appropriate subdirectory, for example `apps/web/src/components/resume-builder/build-resume.tsx`.

## Package manager

Use pnpm exclusively for installing dependencies and running package scripts. Do not use npm, Bun, or Yarn. Keep `pnpm-lock.yaml` updated and do not create other package-manager lockfiles.

`pnpm install` at the repo root installs everything — the workspace covers `apps/web`, `apps/api`, and `packages/*`, under one lockfile. Add a dependency to a single app with `pnpm --filter @quinchool/web add <pkg>`, never by running install inside `apps/`.

## Tailwind CSS

Use the project's Tailwind design tokens — never arbitrary bracket values like `w-[240px]`, `text-[#fff]`, or `[mask-type:luminance]`. Reach for scale tokens (`w-60`, `text-sm`, `gap-2`) or add a token to `@theme` in `apps/web/src/app/globals.css`. Arbitrary **variants** (`data-[state=open]:`, `[&_svg]:`) are allowed. This is enforced by `pnpm lint:tailwind`, a husky pre-commit hook, and CI. See AGENTS.md for the full policy and the `tailwind-allow-arbitrary` escape hatch.

## Git push safety

Never run `git push`, `git push --force`, `git push -f`, or `git push --force-with-lease` (or push to any remote in any other way) unless the user explicitly asks for it in the current chat message — even in bypass-permissions mode. Do not push automatically as part of "finishing" a task.

## Formatting

Never run `pnpm format` (or `biome format --write`) with no path — it rewrites the whole repo. Pass only the files you changed.
