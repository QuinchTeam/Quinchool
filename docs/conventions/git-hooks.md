# Git Hooks

Husky runs `pnpm exec vp staged --concurrent false` before each commit. Rules live in the root `vite.config.ts`.

Use Node.js 22.22.1 or newer for the commit tooling.

## Staged checks

- Format and lint JavaScript and TypeScript with Vite+; use the web React and Next.js rules for web files.
- Format supported stylesheets, markup, JSON, YAML, and Markdown with Vite+.
- Check Tailwind conventions only for staged web source files.
- Lint and format Python with Ruff from `apps/ai/.venv`. Install `apps/ai/requirements-dev.txt` into that environment during local setup.
- Scan all staged files for secrets with Secretlint's recommended rules, including files force-added despite `.gitignore`.

Tasks run sequentially so formatters and scanners do not read or write the same file concurrently. Vite+ handles partially staged files and adds fixes back to the index.

## Commit messages

Husky's `commit-msg` hook requires `type(scope): message` or `type: message`. Scope is optional; when present, it must be non-empty and contain no whitespace or parentheses.

Use a lowercase type: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, or `test`.

Aim for 50 characters and keep the entire subject line within 72 characters, including type and scope. There is no universal length requirement; 72 is this project's enforced maximum. Put longer explanations in the optional commit body.

```text
feat(auth): add password reset
docs: organize project conventions
```

Every commit follows this format, including merge and revert commits. Describe breaking changes in a `BREAKING CHANGE:` footer.

## Validation timing

Do not rerun checks after every edit. Pre-commit handles the staged checks above. Run full type checks, tests, and builds when committing and pushing, or when explicitly requested.

The staged lint configuration disables type-aware linting and type checking. The normal Vite+ checks retain type-aware validation.

Secret scans detect supported credential patterns; they cannot guarantee that every secret will be found.
