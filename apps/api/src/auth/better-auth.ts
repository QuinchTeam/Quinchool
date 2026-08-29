/**
 * The better-auth instance, now that the API issues sessions rather than the
 * web app. The web app keeps the React client and reads the same cookie.
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "../config/env";
import type { PrismaService } from "../prisma/prisma.service";

export type Auth = ReturnType<typeof createAuth>;

/**
 * Takes the client Nest already built so the process keeps one connection
 * pool. The `nextCookies()` plugin is gone with Next: it only existed to set
 * cookies on server-action responses.
 */
export function createAuth(prisma: PrismaService) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    // The browser calls this from the web app's origin, so that origin has to
    // be trusted for the cookie to be accepted.
    trustedOrigins: [env.WEB_ORIGIN],
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        // No SMTP in local/dev — log the reset link so it can be opened
        // manually. Swap this for a real email sender when wiring up
        // production.
        console.log(
          `\n[better-auth] Password reset link for ${user.email}:\n${url}\n`,
        );
      },
    },
  });
}
