import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: [
      "**/.next/**",
      "**/next-env.d.ts",
      "**/dist/**",
      "**/dist-test/**",
    ],
    plugins: ["typescript"],
    options: { typeAware: true, typeCheck: true },
    overrides: [
      { files: ["apps/web/**"], plugins: ["react", "nextjs", "typescript"] },
    ],
  },
  fmt: {
    printWidth: 80,
    ignorePatterns: [
      "pnpm-lock.yaml",
      "**/.next/**",
      "**/next-env.d.ts",
      "**/dist/**",
      "**/dist-test/**",
    ],
  },
  staged: {
    "*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}": [
      "vp lint --config .oxlintrc.staged.json --fix",
      "vp fmt",
    ],
    "*.{css,scss,html,json,jsonc,yaml,yml,md,mdx}": "vp fmt",
    "apps/web/**/*.{css,js,jsx,mjs,cjs,ts,tsx,mts,cts,mdx}":
      "node apps/web/scripts/check-tailwind-arbitrary.mjs",
    "*.py": [
      "node scripts/ruff.mjs check --fix",
      "node scripts/ruff.mjs format",
    ],
    "*": "secretlint --no-glob --no-gitignore",
  },
});
