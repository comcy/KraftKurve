FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source (including libraries and all apps needed for the build)
COPY apps/web ./apps/web

# Build the monolithic mobile app
RUN pnpm run build:mobile

# Serve Stage
FROM nginx:alpine

# Copy custom nginx config
COPY apps/web/nginx-custom.conf /etc/nginx/conf.d/default.conf

# Copy build output to nginx html folder
# Based on Angular 21/Application builder defaults: dist/kraftkurve-mobile-app/browser
COPY --from=builder /app/apps/web/dist/kraftkurve-mobile-app/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
