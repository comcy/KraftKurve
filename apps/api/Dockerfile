FROM node:22-alpine AS builder

WORKDIR /app

# Pin pnpm version — pnpm@latest changes behaviour across releases
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/

# Install without running post-install scripts (avoids ERR_PNPM_IGNORED_BUILDS),
# then rebuild esbuild explicitly so its native binary is available for the build.
RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild esbuild

# Copy source
COPY apps/api ./apps/api

# Build API
RUN pnpm run build:api

# Production Stage
FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Default environment
ENV PORT=3000
ENV DATA_DIR=/app/data

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
