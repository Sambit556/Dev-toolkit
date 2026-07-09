# ─── Build Stage ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests for dependency installation
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm install --workspace=packages/shared --workspace=apps/web

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build shared
RUN npm run build --workspace=packages/shared

# Build Next.js (standalone mode)
ENV DOCKER_BUILD=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

# ─── Production Stage ────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -g 1001 -S devchrono && adduser -S devchrono -u 1001 -G devchrono

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder --chown=devchrono:devchrono /app/apps/web/.next/standalone ./
COPY --from=builder --chown=devchrono:devchrono /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=devchrono:devchrono /app/apps/web/public ./apps/web/public

USER devchrono

EXPOSE 4001

ENV PORT=4001
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4001/api/health || exit 1

CMD ["node", "apps/web/server.js"]
