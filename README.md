# KraftKurve

> Lokal-first, self-hosted PWA für Fitnessstudio-Tracking (Training + Protein), multi-user, Open-Source.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Angular 21 (PWA, Mobile-first) |
| Backend | Node.js + Express + TypeScript |
| Persistence | NDJSON (adapter-based, swap-ready) |
| Paketmanager | pnpm |

## Deployment

KraftKurve ist für den Docker-Einsatz optimiert (ideal für Proxmox LXC oder Home-Server) und bietet ein interaktives Setup-Skript.

**Hinweis**: Da KraftKurve eine PWA ist, wird **HTTPS/SSL** für den Offline-Modus und die Installation auf Mobilgeräten dringend empfohlen.

### 1. Interaktives Setup (Empfohlen)

Das Setup-Skript konfiguriert deine Admin-Zugangsdaten und lässt dich zwischen Docker und systemd wählen.

```bash
chmod +x setup.sh
./setup.sh
```

### 2. Docker Compose (Proxmox / Home-Server)

Für eine isolierte Umgebung mit minimalem Wartungsaufwand:

1.  **Repository klonen**: `git clone ... && cd KraftKurve`
2.  **Setup ausführen**: `./setup.sh` (Wähle Option 1)
3.  **Manuell starten** (Alternative zu Setup):
    ```bash
    # .env mit ADMIN_EMAIL, ADMIN_PASSWORD und PORT anlegen
    docker compose up -d --build
    ```
4.  **Erreichbar unter**: `http://localhost:8080` (oder dein gewählter Port).

### 3. systemd (Direkt auf Linux-Host)

Wenn du kein Docker nutzen möchtest:

1.  **Setup ausführen**: `./setup.sh` (Wähle Option 2)
2.  **Service registrieren**:
    ```bash
    sudo cp kraftkurve-api.service /etc/systemd/system/
    sudo systemctl enable --now kraftkurve-api
    ```
3.  **Frontend**: Serviere `apps/web/dist/kraftkurve-mobile-app/browser` via Nginx und leite `/api` an `localhost:3000` weiter.

Detaillierte Anleitung & Proxmox-Tipps: [Deployment Guide](docs/DEPLOYMENT.md)

## Struktur

```
apps/
  web/               # Angular Workspace
    projects/
      app-shell/           # Haupt-Shell / User-PWA
      app-training/        # Training-only App
      app-admin/           # Admin-only App
      feature-auth/
      feature-training/
      feature-nutrition/
      feature-progress/
      feature-admin/
      data-access-auth/      # AuthService, Guards, Interceptor
      data-access-training/
      data-access-nutrition/
      data-access-progress/
      data-access-admin/
      shared-models/         # Domain-Interfaces + IRepository<T>
      shared-utils/          # UUID, Date helpers
  api/               # Node.js API
    src/
      domain/              # Entities (User, Invite, …)
      infrastructure/
        repositories/      # Repository Interfaces (swap-ready)
        ndjson/            # NDJSON Adapter Implementierungen
      modules/
        auth/              # AuthService + Routes
      training/          # Training Session CRUD
      middleware/          # JWT Auth Middleware
      container.ts         # Dependency Wiring
```

## Setup

```bash
# Voraussetzung: pnpm, Node >= 20
pnpm install
```

### API

```bash
# .env anlegen (oder ENV-Vars setzen):
# JWT_SECRET=...   (Pflicht in Prod)
# DATA_DIR=./data  (Default: ./data relativ zu apps/api)
# PORT=3000

pnpm -C apps/api dev     # Dev mit Hot-Reload
pnpm -C apps/api build   # Produktions-Build
```

### Web (Angular PWA)

```bash
pnpm run dev:shell       # App-Shell Dev-Server
pnpm run build:shell     # App-Shell Produktions-Build
pnpm run dev:training    # Training-App Dev-Server
pnpm run build:training  # Training-App Produktions-Build
pnpm run dev:admin       # Admin-App Dev-Server
pnpm run build:admin     # Admin-App Produktions-Build
```

## Auth UI

- `feature-auth` nutzt Angular Signal Forms (`FormRoot`, `FormField`, `form()` + schema-basierte Validatoren).
- Login und Registrierung sind als gemeinsame UI-Lib für alle 3 Apps umgesetzt.
- Registrierung bleibt `admin-invite only`.

## Auth Flow

1. Admin-Bootstrap: `POST /auth/bootstrap` (einmalig, wenn noch kein User).
2. Admin erstellt Invite: `POST /auth/invite` (JWT required, role=admin).
3. Neuer User registriert: `POST /auth/register` mit Invite-Code.
4. Login: `POST /auth/login` → JWT zurück.

## Training Flow

1. Session-Liste: `GET /training/sessions` (JWT required).
2. Session anlegen: `POST /training/sessions`.
3. Session laden: `GET /training/sessions/:id`.
4. Session ändern: `PUT /training/sessions/:id`.
5. Session löschen: `DELETE /training/sessions/:id`.
6. Übungen je Session: `GET/POST /training/sessions/:sessionId/exercises`.
7. Übung ändern/löschen: `PUT/DELETE /training/sessions/:sessionId/exercises/:exerciseId`.
8. Sätze je Übung: `GET/POST /training/sessions/:sessionId/exercises/:exerciseId/sets`.
9. Satz ändern/löschen: `PUT/DELETE /training/sessions/:sessionId/exercises/:exerciseId/sets/:setId`.
10. Live-Progress: `GET /training/sessions/:sessionId/progress`.
11. Trainingsplan-Templates: `GET/POST /training/templates`, `PUT/DELETE /training/templates/:templateId`.
12. Template-Reminder: `GET /training/templates/reminders?withinDays=14`.
13. Body-Heatmap: `GET /training/insights/heatmap?days=28`.
14. Stagnation-Suggestions: `GET /training/insights/stagnation-suggestions?window=3&incrementKg=2.5&minCompletedSets=2`.
  - optional tuning: `minCompletionRatio`, `deloadDropPercent`.

Frontend:
- `data-access-training` kapselt Session/Exercise/Set/Progress API Calls.
- `data-access-training` kapselt auch Template/Reminder/Insight Calls.
- `feature-training` nutzt Signal Forms für Session + Exercise/Set Eingabe.
- Training-Session-Detail zeigt Live-Fortschritt (`completedSets/totalSets/%`) für laufendes Workout.
- Offline write queue (localStorage): fehlgeschlagene Writes bei Offline werden zwischengespeichert und bei Online-Event automatisch erneut gesendet.

## Shell Dashboard

- App-Shell hat jetzt echte Navigation (Dashboard, Training, Nutrition, Progress).
- Dashboard zeigt:
  - auslaufende Trainingsplan-Templates,
  - Gewichtsvorschläge bei Stagnation,
  - Body-Heatmap pro Muskelgruppe.

## Training Overview Erweiterung

- In der Training-Overview ist jetzt Template-CRUD direkt nutzbar (Anlegen, Aktivieren/Deaktivieren, Löschen).
- Offline Queue ist sichtbar steuerbar:
  - Queue-Länge anzeigen,
  - manueller Sync,
  - Dead-letter Liste für nicht replay-bare Requests,
  - Dead-letter Cleanup.

## Idempotency Keys

- Mutierende Training-Endpoints (POST/PUT/DELETE) unterstuetzen `x-idempotency-key`.
- API dedupliziert pro `userId + key + method + requestPath` und liefert bei Replay dieselbe Antwort.
- Client sendet fuer jede Write-Operation automatisch einen stabilen Key (auch im Offline-Replay).
- Ergebnis: keine Doppel-Creates/Updates bei Retry, Timeout oder Online-Reconnect.

## Tests (API)

- `pnpm -C apps/api test` führt umfangreiche Idempotency + Offline-Queue Tests aus (27 Tests, 0 Fehler):

**IdempotencyService Tests (2):**
- Speichert und replayed Responses bei identischem Request-Key
- Aktualisiert Version beim Re-Save mit selber Tuple

**Route-Level Idempotency Tests (4):**
- POST `/sessions` mit identischem `x-idempotency-key` replays Antwort
- POST mit unterschiedlichem Key führt Handler erneut aus
- PUT `/sessions/{id}` replays mit stabiler x-idempotency-key
- DELETE `/sessions/{id}` replays mit stabiler x-idempotency-key

**Dead-Letter Classification Tests (11):**
- 409 Conflict → sofort Dead-Letter
- 422 Unprocessable Entity → sofort Dead-Letter
- 412 Precondition Failed → sofort Dead-Letter
- 401/403 Client Error → Dead-Letter nach 3 Versuche
- 500/503 Server Error → Retry mit Backoff, nicht Dead-Letter
- Attempts Counter korrekt inkrementiert
- Metadaten bei Move-to-Dead-Letter erhalten

**Offline Queue + Idempotency Integration Tests (7):**
- Stabile Operation-ID als Idempotency-Key
- Replay mit gleicher ID verhindert Duplikate bei Timeout
- Unterschiedliche Ops bekommen unterschiedliche Keys
- Conflict-Response (409) wird gecacht und replayed
- Attempts Counter unabhängig von Idempotency Version
- Kompletter Flow: Queue → Attempt → Success → Clear
- Kompletter Flow: Queue → Conflict → Dead-Letter → Manual-Clear

## Progress Seite

- Feature-Progress zeigt jetzt echte Daten statt Placeholder:
  - Body-Heatmap,
  - Stagnationsvorschlaege (increase/deload),
  - letzte Sessions.

## Datenspeicher

- NDJSON-Files unter `DATA_DIR/` (`users.ndjson`, `nutrition-settings.ndjson`, `invites.ndjson`, …).
- Benutzerspezifische Einstellungen sind normalisiert in `nutrition-settings.ndjson` (gelinkt via `userId`).
- Alle Repository-Interfaces in `apps/api/src/infrastructure/repositories/`.
- Adapter-Swap: neue DB-Klasse implementiert das Interface → container.ts tauschen.

## Nutrition Flow

1. **Dashboard**: Tagesübersicht mit Protein-Fortschrittsbalken und Quick-Log Presets.
2. **Quick-Track**: 3 konfigurierbare Presets (z.B. +20g, +40g, +60g) für sofortiges Logging.
3. **History Swipe-Up**: Detaillierte Historie in einem Bottom-Sheet (90% Screen-Höhe).
  - **Sticky Chart**: Brutalistischer Bar-Chart (Woche, Monat, Jahr) oben fixiert mit Goal-Target-Line.
  - **Daily Grouping**: Einträge werden pro Tag gruppiert mit Gesamtsummen.
4. **Settings**: Konfiguration von Tagesziel und Quick-Log Presets auf der Profil-Seite.

## Training & Details Flow

1. **Mission Control**: Dashboard zeigt den Status des letzten Workouts mit Schnellzugriff auf Details.
2. **Workout Terminal**: Echtzeit-Tracking mit automatischer Stoppuhr und dynamischer Übungswahl.
  - **Smart Provisioning**: Geplante Workouts laden automatisch alle Übungen, Sätze und Supersets der Routine.
  - **Smart Defaults**: Neue Übungen starten automatisch mit Sätzen basierend auf Last-Time Details.
  - **Editable Tracking**: Gewichte und Reps werden direkt im Terminal editiert und per Blur-Event gespeichert.
3. **Protocol Sequence**: Intelligente Vorschläge für die "nächste Routine" basierend auf der Historie und der im Plan definierten Reihenfolge.
4. **Library Expansion**: Neue Übungen werden automatisch in den globalen Katalog aufgenommen (Auto-Upsert) und sind per Autocomplete sofort suchbar.
5. **Progression IQ**: Der virtuelle Trainer schlägt Ziele vor (Gewicht vs. Volumen), basierend auf der gewählten Strategie in den Settings.
6. **Workout Archive**: Deep-Dive Details zu vergangenen Sessions via Swipe-Up Bottom Sheet.
7. **Plan Management**: Vollständige Kontrolle über Zeiträume, Trainingsfrequenz (Sessions/Woche) und Routine-Reihenfolge (Drag & Drop).

## Auth & Admin Flow

Das System nutzt einen geschlossenen Registrierungsprozess:

1. **Bootstrap**: System-Initialisierung erstellt den ersten Admin (`POST /api/auth/bootstrap`).
2. **Invites**: Admins generieren Einladungscodes exklusiv in der **Web Admin App**.
3. **Registrierung**: Neue Nutzer registrieren sich mit einem Code in der **Mobile App** oder der **Web Shell**.
4. **Persistence**: Sessions bleiben via `localStorage` dauerhaft aktiv (survives F5).
5. **Logout**: "Terminate Session" löscht alle Tokens und leitet zum Login zurück.

## Design: Tactical Logbook

Das System nutzt eine "Cyber-Athletic" Ästhetik:
- **Fonts**: `Press Start 2P` (Headlines) & `JetBrains Mono` (Daten).
- **Brutalismus**: Harte Kontraste, 1px Border, "Tape"-Header Effekte.
- **Farben**: Schwarz (#131313) mit Akzenten in Gelb (Primary), Magenta (Secondary) und Grün (Tertiary).
- **Stationary Grid**: Ein fixiertes Hintergrundraster (`html::before`) sorgt für eine stabile Archiv-Optik beim Scrollen.
- **Opaque UI**: Header und Navigation sind 100% deckend (Solid Surfaces), um Überlappungen sauber zu trennen.
- **Refined Inputs**: Numerische Eingaben nutzen `inputmode` statt nativer Spinner-Buttons für ein cleanes Interface.
