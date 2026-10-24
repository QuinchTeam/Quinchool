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
    // S3-compatible object storage: Cloudflare R2 in production, Garage locally.
    S3_ENDPOINT: z.url().default("http://127.0.0.1:3900"),
    S3_REGION: z.string().min(1).default("garage"),
    S3_BUCKET: z.string().min(1).default("quinchool-uploads"),
    // Optional so the API still boots before storage is configured; uploads then answer 503.
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
  })
  .parse(process.env);
