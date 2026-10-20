import { defineConfig } from "vite-plus";

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
});
