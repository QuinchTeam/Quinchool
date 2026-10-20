import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "../config/env";
import type { PrismaService } from "../database/prisma/prisma.service";
import { domainLog } from "../observability/logger";

export type Auth = ReturnType<typeof createAuth>;

// Reuse Nest's Prisma client so auth shares the connection pool.
export function createAuth(prisma: PrismaService) {
  return betterAuth({
    logger: {
      log: (level) =>
        domainLog(
          level === "error" ? "error" : level === "warn" ? "warn" : "info",
          "auth.message",
          { domain: "auth" },
        ),
    },
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    // Trust the web origin so cross-origin session cookies are accepted.
    trustedOrigins: [env.WEB_ORIGIN],
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    advanced: {
      // Share cookies with the web subdomain so its proxy can read the session.
      crossSubDomainCookies: env.COOKIE_DOMAIN
        ? { enabled: true, domain: env.COOKIE_DOMAIN }
        : { enabled: false },
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        domainLog("warn", "auth.password-reset.delivery-unconfigured", {
          domain: "auth",
        });
        // Development prints reset links; production still needs an email sender.
        if (process.env.NODE_ENV !== "production")
          console.log(
            `\n[better-auth] Password reset link for ${user.email}:\n${url}\n`,
          );
      },
    },
  });
}
