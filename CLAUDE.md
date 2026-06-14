@AGENTS.md

## Tailwind CSS

Use the project's Tailwind design tokens — never arbitrary bracket values like `w-[240px]`, `text-[#fff]`, or `[mask-type:luminance]`. Reach for scale tokens (`w-60`, `text-sm`, `gap-2`) or add a token to `@theme` in `src/app/globals.css`. Arbitrary **variants** (`data-[state=open]:`, `[&_svg]:`) are allowed. This is enforced by `bun run lint:tailwind`, a husky pre-commit hook, and CI. See AGENTS.md for the full policy and the `tailwind-allow-arbitrary` escape hatch.

## Git push safety

Never run `git push`, `git push --force`, `git push -f`, or `git push --force-with-lease` (or push to any remote in any other way) unless the user explicitly asks for it in the current chat message — even in bypass-permissions mode. Do not push automatically as part of "finishing" a task.
