This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tailwind CSS

Use the project's Tailwind theme tokens instead of arbitrary values or properties.
Arbitrary variants such as `data-[state=open]:block` and `[&_svg]:size-4` remain
allowed. Add genuinely missing values to `@theme` in `src/app/globals.css`.

```bash
npm run lint:tailwind
npm run test:tailwind
```

The guard runs against staged stylesheets, JavaScript, TypeScript, and MDX files
through the Husky pre-commit hook and against all first-party source in CI.
Generated shadcn primitives under `src/components/ui` are excluded. For a rare
justified exception, add `tailwind-allow-arbitrary` in a comment on the same
line.
