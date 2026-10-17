import { defineConfig } from "vite-plus";

// ponytail: Next owns dev/build; Vite+ only runs lint, fmt, check, test, staged.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  lint: {
    ignorePatterns: [".next/**", "next-env.d.ts"],
    plugins: ["react", "nextjs", "typescript"],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    printWidth: 80,
    ignorePatterns: [".next/**", "next-env.d.ts"],
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
  },
  staged: {
    "*.{css,js,jsx,mjs,cjs,ts,tsx,mts,cts,mdx}":
      "node scripts/check-tailwind-arbitrary.mjs",
  },
});
