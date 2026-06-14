// Prisma 7 config. The connection URL lives here (and is passed to the
// PrismaClient via a driver adapter at runtime) — it is no longer allowed in
// schema.prisma. See https://pris.ly/d/prisma7-client-config
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
