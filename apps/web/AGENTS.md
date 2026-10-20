# Conventions and Practice

- We use Feature-based structure: each feature lives under `src/features/<feature>/`, with its own `components/`, `hooks/`, `lib/`, and `validations/` subfolders as needed. Keep `src/app/` for routes and Next.js conventions only. `src/components/`, `src/hooks/`, and `src/lib/` hold cross-feature shared code only.
- Use TanStack Query for API data fetching, mutations, and client-side server-state caching. Keep queries and mutations in feature hooks, reuse query keys, and invalidate or update affected queries after mutations. Do not use Next.js server-side data fetching, Server Actions, route handlers, or Next.js cache APIs for application data.
- Use React Hook Form with Zod validation through `zodResolver` and shared form components from `src/components/ui/form.tsx` for user input forms. Use a semantic `<form>` with `handleSubmit`, and submit API changes through TanStack Query mutations. Simple actions such as delete buttons and toggles can call mutations directly without a form.
- Follow [CSS conventions](../../docs/conventions/frontend/css.md).
- Use Tailwind theme tokens. Do not add arbitrary values or properties. Arbitrary variants are allowed. Add missing tokens in `apps/web/src/app/globals.css`.
- Preserve their established appearance: colors, typography, sizes, spacing, borders, radii, shadows, and interaction states. Use existing component props and variants for customization. Keep layout spacing in parent containers. When a new appearance is needed, always ask me first.
- Use Phosphor icons with individual imports from `@phosphor-icons/react/dist/ssr/<IconName>` and the shared `AppIcon` component in `src/components/ui/icon.tsx`. Icons must always use duotone; Use regular icons only for: Check, Plus, Cross, Chevrons, Ellipsis/Dot, and Arrows.

## Adding Tests

Tests live in a dedicated `tests/` folder at the same level as `src/`. The `tests/src/` tree mirrors `src/` exactly (`tests/src/features/<feature>/...`), containing only test files.
