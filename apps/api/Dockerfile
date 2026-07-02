# ─── Build Stage ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install --workspace=packages/shared --workspace=apps/api

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build shared then API
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# ─── Production Stage ────────────────────────────────────────
FROM node:20-alpine AS runner

# Create non-root user
RUN addgroup -g 1001 -S devchrono && adduser -S devchrono -u 1001 -G devchrono

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Install only production dependencies
RUN npm install --workspace=packages/shared --workspace=apps/api --omit=dev

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

USER devchrono

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
