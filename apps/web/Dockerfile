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
ARG NEXT_PUBLIC_API_URL=https://api.quinchool.quinchy.dev
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY apps/web apps/web
RUN pnpm --filter @quinchool/web build

FROM node:22-bookworm-slim AS runtime
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /workspace/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 8080
CMD ["node", "apps/web/server.js"]

