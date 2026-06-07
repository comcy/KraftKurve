# Plan: KraftKurve Dockerization

## Goal
Implement a robust, easy-to-use Docker Compose setup for test and production deployment (especially for Proxmox LXC).

## Steps
1. [x] Research workspace build process (pnpm, Native Federation vs Monolith).
2. [x] Create `apps/api/Dockerfile` (Node.js).
3. [x] Create `apps/web/Dockerfile` (Angular Monolith + Nginx).
4. [x] Create `apps/web/nginx-custom.conf` (Nginx config with API proxy).
5. [x] Create root `docker-compose.yml`.
6. [x] Create `docs/DEPLOYMENT.md` with Proxmox specific instructions.
7. [x] Update `README.md` with deployment quick-start.

## Status
Completed. Deployment-ready for monolithic mobile app.
Future: Add MFE-specific deployment configurations.
