import { z } from "zod";

// Load .env locally; production injects variables and needs no file.
try {
  process.loadEnvFile();
} catch {}

export const env = z
  .object({
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().default("http://localhost:3001"),
    AI_SERVICE_URL: z
      .url()
      .default("http://127.0.0.1:8000")
      .transform((url) => url.replace(/\/$/, "")),
    DATABASE_URL: z.url(),
    // Set the shared cookie domain in production; leave it unset on localhost.
    COOKIE_DOMAIN: z.string().min(1).optional(),
    PORT: z.coerce.number().int().positive().default(3001),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
  })
  .parse(process.env);
