/**
 * Every environment value the API reads, parsed once at import time so a bad
 * or missing one fails at boot instead of halfway through a request.
 */

import { z } from "zod";

// Nest does not read .env on its own. Node's own loader covers it, and stays
// quiet in deployed environments where the platform supplies the variables.
try {
  process.loadEnvFile();
} catch {
  // No .env file; fall through to whatever is already in process.env.
}

export const env = z
  .object({
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url().default("http://localhost:3001"),
    AI_SERVICE_URL: z
      .url()
      .default("http://127.0.0.1:8000")
      .transform((url) => url.replace(/\/$/, "")),
    DATABASE_URL: z.url(),
    // Set in production so the session cookie set by api.<domain> is also sent
    // to the web app on <domain>. Unset locally, where both are localhost.
    COOKIE_DOMAIN: z.string().min(1).optional(),
    PORT: z.coerce.number().int().positive().default(3001),
    WEB_ORIGIN: z.url().default("http://localhost:3000"),
  })
  .parse(process.env);
