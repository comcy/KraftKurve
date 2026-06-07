# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is KraftKurve

Local-first, self-hosted PWA for gym tracking (training + nutrition). Multi-user, invite-only registration, deployable via Docker Compose (ideal for home server / Proxmox LXC). Two independent Angular apps: `kraftkurve-mobile-app` (user app) and `app-admin` (admin app).

## Package manager

**pnpm** only (workspace). Never use npm or yarn.

## Development Commands

```bash
# Install all dependencies
pnpm install

# --- Primary development workflow ---
pnpm run dev:api        # API on http://localhost:3000
pnpm run dev:mobile     # Mobile PWA on http://localhost:4208 (proxies /api → :3000)

# --- Admin app ---
pnpm run dev:admin      # Admin PWA on http://localhost:4201

# --- Build ---
pnpm run build:api
pnpm run build:mobile
pnpm run build:admin

# --- API tests (Node built-in test runner) ---
pnpm -C apps/api test

# --- Run a single API test file ---
pnpm -C apps/api tsx --test src/modules/training/training.service.test.ts

# --- Production (Docker) ---
docker compose up -d --build
```

The Angular dev server uses `apps/web/proxy.conf.json` to forward `/api/*` → `http://localhost:3000` (stripping the `/api` prefix).

## Project Structure

```
apps/
  api/                  # Node.js + Express + TypeScript API
    src/
      container.ts      # Dependency wiring — all repo instances created here
      main.ts           # App bootstrap + auto-admin creation
      domain/           # Pure entity types (no logic)
      infrastructure/
        repositories/   # Repository interfaces (ITrainingSessionRepository, etc.)
        ndjson/         # NDJSON file adapter implementations
      middleware/       # JWT auth middleware (requireAuth, requireAdmin)
      modules/
        auth/           # AuthService + routes
        training/       # TrainingService + routes
        nutrition/      # NutritionService + routes
        idempotency/    # IdempotencyService (dedup for POST/PUT/DELETE)
  web/                  # Angular 21 workspace
    proxy.conf.json     # Dev proxy: /api → localhost:3000
    projects/
      kraftkurve-mobile-app/   # PRIMARY app — all active development goes here
        src/app/
          app.config.ts        # Zoneless, PWA, auth interceptor
          app.routes.ts        # Top-level routes + authGuard
          core/
            services/
              training-state.service.ts  # Active session + timer state (Signals)
              nutrition-state.service.ts # Daily nutrition state (Signals)
            components/
              tactical-dialog/           # Shared modal component
          features/
            dashboard/    # Post-login home: workout summary + suggestions
            training/     # Workout terminal, plan/routine management
            nutrition/    # Quick-log presets, history bottom sheet
            progress/     # Body heatmap, stagnation suggestions
            settings/     # User preferences, presets
      lib-auth-data-access/    # AuthService, authGuard, authInterceptor, APP_ID token
      lib-training-data-access/  # TrainingService + all DTOs
      lib-nutrition-data-access/ # NutritionService + DTOs
      lib-progress-data-access/
      lib-auth-feature-login/
      lib-auth-feature-register/
      lib-training-feature-*/  # Feature libs (legacy, may be unused in mobile app)
      app-shell/         # Legacy shell app
      app-admin/         # Admin-only app (invite management)
```

## Architecture Patterns

### API

- **Repository pattern**: every data type has an interface in `infrastructure/repositories/` and an NDJSON adapter in `infrastructure/ndjson/`. To swap to a real DB, implement the interface and update `container.ts`.
- **DI via constructor**: services take repositories as constructor args (no framework DI). `container.ts` instantiates everything and exports the singletons used in `main.ts`.
- **Validation at routes**: Zod schemas validate request bodies in route handlers before calling services.
- **Idempotency**: mutating endpoints accept `x-idempotency-key` header. The `IdempotencyService` deduplicates responses per `(userId, key, method, path)`. Always pass this key from the frontend for offline-replay safety.
- **Data files**: stored under `DATA_DIR` (default `apps/api/data/`). Each entity type is a separate `.ndjson` file.

### Frontend (kraftkurve-mobile-app)

- **Zoneless**: `provideZonelessChangeDetection()` — change detection does not run automatically. All state must use `signal()` / `computed()` or manually trigger CD.
- **State layer**: `TrainingStateService` and `NutritionStateService` (in `core/services/`) hold the app-wide reactive state via Angular Signals. Components inject these services and bind to their signals directly.
- **Data access libs**: `lib-training-data-access` exports `TrainingService` (HttpClient wrappers), all DTOs, and enums. Components import from the lib, not from the API directly.
- **`TacticalDialogComponent`**: the only dialog used throughout the app. Open via `MatDialog.open(TacticalDialogComponent, { data: TacticalDialogData })`. Supports text/number/select/autocomplete fields.
- **Auth**: `lib-auth-data-access` exports `AuthService` (JWT to/from localStorage), `authGuard`, `authInterceptor` (adds Bearer header, redirects on 401), and `APP_ID` injection token.
- **Offline queue**: failed writes are queued in localStorage and replayed on reconnect, using stable idempotency keys to avoid duplicates.

### Domain hierarchy

Training: **Plans** → **Routines** → **Sessions** → **Exercises** → **Sets**

## Design System ("Tactical Logbook" / Cyber-Athletic)

- **Fonts**: `Press Start 2P` for headlines, `JetBrains Mono` for all data/body text.
- **Color tokens** (CSS vars on `:root.dark` / `:root.light`): `--primary` (#fdff00 yellow), `--secondary` (magenta), `--tertiary` (#00ff41 green), `--background` (#131313 dark).
- **CSS utility classes**: `label-caps` (uppercase tracking), `data-mono` (monospace data), `log-card` (bordered card), `log-header tape` (card header strip), `headline-lg` (Press Start 2P headline).
- Inputs use `inputmode` attributes instead of native spinners. No rounded corners — sharp/brutal aesthetic with `1px` borders.
- Never introduce soft shadows, gradients, or rounded UI elements that break the aesthetic.

## Environment Variables (API)

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3000` | API listen port |
| `DATA_DIR` | `./data` | NDJSON storage path |
| `JWT_SECRET` | random (dev only) | **Required in production** |
| `DEFAULT_ADMIN_EMAIL` | `admin@kraftkurve.local` | Auto-created admin |
| `DEFAULT_ADMIN_PASSWORD` | auto-generated | Printed to console on first start if not set |
