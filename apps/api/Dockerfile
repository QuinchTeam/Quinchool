# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM dependencies AS build
COPY prisma.config.ts ./
COPY packages/prisma packages/prisma
COPY apps/api apps/api
RUN pnpm prisma generate \
  && pnpm --filter @quinchool/api build \
  && pnpm --filter @quinchool/api deploy --prod --legacy /opt/api

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app/apps/api
# Install OpenSSL so Prisma detects Debian's libssl version.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs api
COPY --from=build --chown=api:nodejs /opt/api ./
COPY --from=build --chown=api:nodejs /workspace/apps/api/dist ./dist
# Keep Prisma config beside node_modules so prisma/config resolves.
COPY --from=build --chown=api:nodejs /workspace/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=api:nodejs /workspace/packages/prisma ./packages/prisma
USER api
EXPOSE 8080
# Run migrations at boot; migrate deploy takes an advisory lock, so concurrent instances are safe.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config prisma.config.ts && exec node dist/main.js"]

