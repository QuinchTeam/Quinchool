// Prisma 7 config. The connection URL lives here (and is passed to the
// PrismaClient via a driver adapter at runtime) — it is no longer allowed in
// schema.prisma. See https://pris.ly/d/prisma7-client-config
//
// Lives at the repo root because the schema belongs to neither app: the CLI is
// a repo-wide tool, like concurrently.
import { defineConfig } from "prisma/config";

// The root .env holds DATABASE_URL for CLI work only; each app carries its own
// copy for runtime, the way each service gets its own env when deployed. The
// deployed API runs `migrate deploy` through this same config with no .env at
// all, so a missing file is not an error.
try {
  process.loadEnvFile();
} catch {
  // No .env file; DATABASE_URL comes from the environment.
}

export default defineConfig({
  schema: "packages/prisma/schema.prisma",
  migrations: {
    path: "packages/prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
