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
# The slim base ships no OpenSSL, so Prisma's migration engine cannot detect a
# libssl version and falls back to guessing 1.1.x on a Debian 12 image.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs api
COPY --from=build --chown=api:nodejs /opt/api ./
COPY --from=build --chown=api:nodejs /workspace/apps/api/dist ./dist
# Both land inside the app directory rather than at /app: the Prisma CLI loads
# prisma.config.ts as a module, so it has to sit where `prisma/config` resolves
# — next to node_modules. Its schema and migrations paths are relative to it.
COPY --from=build --chown=api:nodejs /workspace/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=api:nodejs /workspace/packages/prisma ./packages/prisma
USER api
EXPOSE 8080
# Migrations run at boot rather than from CI: the database is only reachable
# through the Cloud SQL connector attached to this service. Concurrent
# instances are safe — `migrate deploy` takes an advisory lock.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config prisma.config.ts && exec node dist/main.js"]

