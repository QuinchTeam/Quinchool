import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
};

export default async (): Promise<NextConfig> => {
  if (process.env.NODE_ENV !== "production") {
    return nextConfig;
  }

  const { withSentryConfig } = await import("@sentry/nextjs");

  return withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    tunnelRoute: "/sentry-tunnel",
  });
};
