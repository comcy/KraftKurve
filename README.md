# KraftKurve

> Local-first, self-hosted PWA for gym tracking (training + nutrition). Multi-user, invite-only, Docker-ready (Proxmox LXC / home server).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Angular 21, standalone, zoneless, PWA |
| Backend | Node.js + Express + TypeScript |
| Persistence | NDJSON (adapter-based, swap-ready) |
| Package mgr | pnpm (workspace) |

## Dev Commands

```bash
pnpm install

pnpm run dev:api       # API → http://localhost:3000
pnpm run dev:mobile    # Mobile PWA → http://localhost:4208 (proxies /api → :3000)
pnpm run dev:admin     # Admin PWA → http://localhost:4201

pnpm run build:api
pnpm run build:mobile
pnpm run build:admin

pnpm -C apps/api test  # API tests (Node built-in runner)
```

## Deployment

### Proxmox — Ein-Zeiler (empfohlen)

Auf dem Proxmox-Host als root einfügen — erstellt automatisch einen Debian 12 LXC mit Docker und deployt KraftKurve:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/comcy/KraftKurve/main/proxmox-install.sh)"
```

Das Script fragt interaktiv nach CT-ID, Passwörtern und Admin-Credentials. Alles andere (Template, LXC, Docker, Clone, Compose) läuft vollautomatisch.

Detailliert: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

### Alternativ: Manuell via Docker Compose

```bash
./setup.sh          # interaktiv: Admin-Credentials, .env, docker compose up
# → http://localhost:8080
```

### Alternativ: systemd (ohne Docker)

1. `./setup.sh` → Option 2
2. `sudo cp kraftkurve-api.service /etc/systemd/system/ && sudo systemctl enable --now kraftkurve-api`
3. Frontend (`apps/web/dist/kraftkurve-mobile-app/browser`) via Nginx servieren, `/api` → `localhost:3000`

HTTPS/SSL für PWA-Install und Offline-Mode empfohlen — Details in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project Structure

```
apps/
  api/                          # Express + TypeScript API
    src/
      container.ts              # DI wiring — all singletons here
      domain/                   # Pure entity types
      infrastructure/
        repositories/           # Repository interfaces
        ndjson/                 # NDJSON adapter implementations
      modules/
        auth/                   # AuthService + routes
        training/               # TrainingService + routes (sessions, plans, progress)
        nutrition/              # NutritionService + routes
  web/                          # Angular 21 workspace
    proxy.conf.json             # Dev: /api → localhost:3000
    projects/
      kraftkurve-mobile-app/    # PRIMARY user PWA
        src/app/
          app.config.ts         # Zoneless, PWA, auth interceptor
          app.routes.ts         # Routes + authGuard
          core/services/        # TrainingStateService, NutritionStateService (Signals)
          features/             # dashboard, training, nutrition, settings
      app-admin/                # Admin PWA (invite management)
      lib-auth-data-access/     # AuthService, authGuard, authInterceptor
      lib-auth-feature-login/
      lib-auth-feature-register/
      lib-training-data-access/ # TrainingService + all DTOs + MuscleGroup enum
      lib-nutrition-data-access/
      lib-progress-data-access/ # ProgressService, BodyHeatmapInsightDto, WorkoutCalendarDayDto
      lib-progress-feature-overview/  # ProgressOverviewComponent (calendar + muscle load)
      lib-i18n/                 # I18nService, TranslationKey type, locales (de/en/nerdy)
      shared-utils/             # ThemeService (AppTheme), date/uuid utils
```

## Auth Flow

1. Bootstrap: first admin auto-created from `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` env vars on startup.
2. Admin generates invite codes in the **Admin App**.
3. New users register with invite code in the **Mobile App**.
4. JWT stored in `localStorage`, injected by `authInterceptor`, refresh on 401 → redirect to login.

## API Endpoints (summary)

### Auth
- `POST /api/auth/login` — `{ email, password }` → `{ token }`
- `POST /api/auth/register` — `{ inviteCode, displayName, email, password }`
- `POST /api/auth/invite` — admin only → create invite
- `GET /api/auth/invites` — admin only

### Training
- `GET/POST /api/training/sessions`
- `GET/PUT/DELETE /api/training/sessions/:id`
- `GET/POST /api/training/sessions/:id/exercises`
- `PUT/DELETE /api/training/sessions/:id/exercises/:eid`
- `GET/POST /api/training/sessions/:id/exercises/:eid/sets`
- `PUT/DELETE /api/training/sessions/:id/exercises/:eid/sets/:sid`
- `GET/POST /api/training/plans`
- `PUT/DELETE /api/training/plans/:id`
- `GET/POST /api/training/plans/:id/routines`
- `PUT/DELETE /api/training/plans/:id/routines/:rid`
- `GET /api/training/exercises` — exercise catalog
- `POST /api/training/exercises` — upsert exercise
- `GET /api/training/progress/heatmap?days=N` — muscle group session counts
- `GET /api/training/progress/calendar?days=N` — session count + template type per day
- `GET /api/training/settings` / `PUT /api/training/settings` — overload strategy, virtual trainer

### Nutrition
- `GET/POST /api/nutrition/logs`
- `DELETE /api/nutrition/logs/:id`
- `GET /api/nutrition/settings` / `PUT /api/nutrition/settings`

## Environment Variables (API)

| Var | Default | Note |
|---|---|---|
| `PORT` | `3000` | |
| `DATA_DIR` | `./data` | NDJSON storage path |
| `JWT_SECRET` | random | **Required in production** |
| `DEFAULT_ADMIN_EMAIL` | `admin@kraftkurve.local` | |
| `DEFAULT_ADMIN_PASSWORD` | auto-generated | Printed to console on first start |

## Design System

Three switchable themes (Settings → Appearance):

| Theme | Fonts | Colors |
|---|---|---|
| **Tactical** (default) | Press Start 2P + JetBrains Mono | Yellow `#fdff00`, Magenta, Green on `#131313` |
| **Minimal Dark** | Inter | Indigo `#818CF8` on slate navy `#0F172A` |
| **Minimal Light** | Inter | Indigo `#4F46E5` on slate white `#F8FAFC` |

See [docs/UI.md](docs/UI.md) for full design spec.

## Tests

```bash
pnpm -C apps/api test    # 27 tests — idempotency, offline queue, dead-letter classification
```

## Data Storage

NDJSON files under `DATA_DIR/`:
`users.ndjson`, `invites.ndjson`, `nutrition-logs.ndjson`, `nutrition-settings.ndjson`,
`training-sessions.ndjson`, `training-exercises.ndjson`, `training-sets.ndjson`,
`training-plans.ndjson`, `training-routines.ndjson`, `training-exercise-catalog.ndjson`,
`training-settings.ndjson`

Repository interfaces in `apps/api/src/infrastructure/repositories/` — swap to real DB by implementing interface + updating `container.ts`.
