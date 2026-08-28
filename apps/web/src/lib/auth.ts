import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // No SMTP in local/dev — log the reset link so it can be opened manually.
      // Swap this for a real email sender when wiring up production.
      console.log(
        `\n[better-auth] Password reset link for ${user.email}:\n${url}\n`,
      );
    },
  },
  // nextCookies() must be the last plugin so it can set cookies on the response
  // for server actions. See better-auth Next.js integration docs.
  plugins: [nextCookies()],
});
