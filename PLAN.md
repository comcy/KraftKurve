# plan status 2026-05-19

- done: nutrition add-entry client validation now shows immediate name-required feedback.
- done: nutrition api supports protein goal get/set per user.
- done: nutrition ui has goal input/save/clear directly in page; no separate profile page needed now.
- done: protein card now shows Aufnahme/Ziel + percent + left-to-right fill bar.
- done: build pass api/shell after change (1 css budget warning only).
- done: header has user profile icon link to profile page.
- done: profile page added with per-user protein goal settings.
- done: role split enforced: tracking/nutrition are user-only, admin blocked (403).
- done: shell routes now user-only for dashboard/training/nutrition/progress/profile.
- done: admin in shell sees only admin hint + logout (no user tracking nav).
- done: app-admin now contains dedicated invite-code page integrated via feature-admin routes.
- done: admin dashboard links to invite page; admin scope text clarified.
- done: build pass admin/shell after integration.
- unresolved questions: none.

- done: shell nav live.
- done: session/exercise/set CRUD + live progress.
- done: template CRUD + expiry reminders API.
- done: stagnation suggestion API (configurable rules).
- done: dashboard body heatmap API + UI.
- done: offline write queue (client localStorage replay on online).
- done: offline queue hardening (retry + dead-letter + manual sync controls).
- done: training overview template CRUD UI.
- done: stagnation logic v2 (volume/reps signal + deload rule).
- done: progress page now real data (heatmap + suggestions + recent sessions).
- done: idempotency keys wired end-to-end for write/replay safety.
- done: full test suite (27 tests all passing):
  - idempotency service: 2 tests (save, replay, update)
  - route-level idempotency: 4 tests (POST replay, POST diff-key, PUT replay, DELETE replay)
  - dead-letter classification: 11 tests (409/422/412 conflicts, 401/403 client errors, 500/503 server errors, attempts counter)
  - offline queue + idempotency integration: 7 tests (stable IDs, replay prevents duplicates, cached responses, conflict flows)
- done: builds pass api/shell/training/admin with zero errors.

## unresolved questions
- none

# 1. Kernfunktion: Trainings-Tracker für Übungen mit verschiedenste Geräten und Gewichten & Ernährung 

## Übungskatalog
- Liste aller Geräte und Übungen im Studio (Bildern/Videos optional bzw. durch Admin konfigurierbar im Backend / vom Studio selbst).
- Filter nach Muskelgruppen, Trainingsziel (Kraft, Hypertrophie, Ausdauer).

## Schnelles Logging
- Vorlagen: “Push-Tag”, “Pull-Tag”, “Beine”, “Ganzkörper”.
- Ein Klick: Übung auswählen → Sätze, Wiederholungen, Gewicht eintragen.
- “Letztes Training laden”: Standardwerte vom letzten Mal werden automatisch vorgeschlagen.

## Verlauf pro Übung
- Mini-Grafiken pro Übung: wie haben sich Gewicht, Wiederholungen oder Volumen entwickelt.
- Hinweis: “Heute mehr/gleich/weniger als letztes Mal”.

# 2. Personalisierte Trainingspläne

## Onboarding-Fragebogen (optional)
- Ziele: Muskelaufbau, Fettabbau, Leistungssteigerung, gesund bleiben.
- Erfahrung: Anfänger, Fortgeschritten, Profi.
- Trainingstage pro Woche.
- Automatisch generierte Pläne
- Basierend auf dem Fragebogen.
    - Z. B. 2er-Split, 3er-Split, Ganzkörperplan.
    - Individuelle Anpassung
- User kann Übungen austauschen (z. B. Beinpressen statt Kniebeugen).
- Notizen pro Tag: “Heute müde”, “Schlaf schlecht”, “Stress hoch”.

# 3. Gamification & Motivation

## Badges & Achievements
- “3x pro Woche trainiert für 4 Wochen”.
- “10% mehr Gewicht bei Bankdrücken in 8 Wochen”.

## Streaks
- Trainingstage am Stück, Kalender mit Markierungen.
- Sanfte Erinnerungen bei unterbrochenen Streaks (“Lust auf ein kurzes Workout?”).

## Challenges
- Studioweite Challenges (wenn Anbindung ans Studio geplant):
- “Wer schafft in 1 Monat die meisten Trainingseinheiten?”
- “Team-Challenges” für Freunde oder Gruppen.

# 4. Fortschritts-Visualisierung

## Dashboard
- Gesamtvolumen pro Woche (Trainingstonnen / Wiederholungen).
- Trainingshäufigkeit und -dauer.
- Muskelgruppen-Heatmap: Welche Bereiche werden häufig/wenig trainiert?

## Körperdaten
- Gewicht, Umfänge, Körperfett (optional, manuell eingetragen).
- Vorher-Nachher-Vergleich mit Diagrammen und optional Fotos (privat).

# 5. Studio-spezifische Features (optional, falls Kooperation mit Studios)

## Gerätekonfiguration im Plan
- Jedes Gerät im Studio mit eigener ID/QR-Code.
- User scannt den QR-Code am Gerät → App zeigt empfohlene Einstellungen (Sitzhöhe, Griffposition, Startgewicht).

## Belegungsanzeige (einfacher Ansatz)
- User kann freiwillig “Gerät belegt” markieren → für andere wird gezeigt: “Gerät voraussichtlich noch ca. X Minuten belegt”.
- Statistiken: Welche Uhrzeiten sind typischerweise voll/leer.

## Kommunikation
- News / Aktionen vom Studio: Kurse, Special Days, Angebot für Personal Training.

# 6. PWA-spezifische Ideen (Technik & UX)

## Offline-Fähigkeit
- Training kann offline geloggt werden (schlechter Empfang im Studio).
- Synchronisation läuft, sobald wieder Internet vorhanden ist.
- Homescreen-Integration
- “Zum Startbildschirm hinzufügen” mit eigenem Icon → fühlt sich wie eine echte App an.

## Performance & UI
- Super-schnelle Eingabe mit großen Buttons (Schwitzfinger-Modus im Gym).
- Ein-Hand-Bedienung, wenig Tippen, viel “+/-”-Buttons.

# 7. Soziale Features (optional)

## Freundesliste
- Freunde einladen, Fortschritte teilen (optional, anonym oder in Zahlen).
Ranking
- Nur wenn sinnvoll: lokale Leaderboards (z. B. “Trainingshäufigkeit”, “Durchhaltevermögen”).
- Privatsphäre beachten: Opt-in für jede Ranking-Teilnahme.

# 8. Monetarisierungs- oder Mehrwert-Ideen

## Premium-Funktionen
- Erweiterte Analysen, mehr Pläne, Progressive-Overload-Vorschläge.
- Videoanleitungen von Trainern (vom jeweiligen Studio).
- Studio-Partnerschaften
- Studios zahlen für Verwaltung, Statistiken, Kundenbindung.
- App als “White Label” für verschiedene Studios.

# 9. Umsetzungsplan v0 (gemeinsam)

## Ziel v0
- In 4-6 Wochen: nutzbare lokal-first PWA für Training + Protein, inkl. Login, Multi-User, Basic Sync.

## Phase 1: Fundament (Woche 1)
- Tech-Entscheid final: Frontend, Backend, DB/Speicher.
- Repo-Struktur, CI, Docker Compose, Env-Konzept.
- Auth-Basis (Register/Login, Rollen: User/Admin).
- Done wenn: lokales Setup in <10 min, Login läuft.

## Phase 2: Training MVP (Woche 2)
- Übungskatalog (CRUD adminseitig, Lesen userseitig).
- TrainingSession + Exercise + Sets erfassen.
- "Letztes Mal" Vorschläge.
- Done wenn: komplettes Workout mobil in <60s loggbar.

## Phase 3: Protein MVP (Woche 3)
- Food-Favoriten + NutritionEntry.
- Tagesziel pro User + Tagesfortschritt.
- Kalender/Tagesansicht Ernährung.
- Done wenn: Tagesprotein in <20s erfassbar.

## Phase 4: Progress + Dashboard (Woche 4)
- Pro Übung: Bestleistung/Volumen Verlauf.
- Wochenübersicht Trainingsanzahl + Proteintrend.
- Dashboard: Heute-Status + letzte Einträge.
- Done wenn: Progress visuell ohne Export nutzbar.

## Phase 5: Offline + Sync (Woche 5)
- Service Worker + lokaler Cache (IndexedDB o. ä.).
- Queue für Offline-Write, Retry bei Online.
- Konfliktregel MVP: Last write wins.
- Done wenn: Offline loggen, später Sync stabil.

## Phase 6: Hardening + Release (Woche 6)
- Basis-Tests (kritische Flows), Error Handling, Logging.
- Security-Minimum: Passwort-Hashing, Rate Limit, Rollenchecks.
- MVP-Doku: Setup, Backup, Restore, Deploy.
- Done wenn: Self-host Install + Basic Ops dokumentiert.

## MVP Scope Freeze (must-have)
- Training loggen, Protein loggen, Progress sehen, Login, Multi-User, Offline+Sync.

## Post-MVP (später)
- Personalisierte Pläne, Gamification, Social, Studio-QR, Belegungsanzeige.

## Entscheidungen fix (2026-05-19)
- Frontend: Angular.
- Backend: Node.js.
- Speicher Start: NDJSON.
- Datenzugriff: abstrakter Data-Layer mit Interfaces/Services, DB austauschbar.
- Auth-Modell: Admin-invite only (kein Self-signup).
- UX-Ziel: Mobile PWA first, Desktop nutzbar, nicht priorisiert.

# 10. Sprint 0 (jetzt als Nächstes)

## Architektur-Schnitt
- Monorepo: apps/web (Angular PWA), apps/api (Node.js), packages/shared.
- Domänenmodule: auth, training, nutrition, progress, admin.
- Clean boundaries: domain -> application -> infrastructure.

## Datenlayer (abstrakt, DB-swap-ready)
- Pro Domäne Repository-Interface definieren (z. B. UserRepository, TrainingRepository).
- Service-Layer nur gegen Interfaces, nie direkt gegen NDJSON.
- NDJSON Adapter als erste Infra-Implementierung.
- Später: Postgres Adapter implementiert gleiche Interfaces.

## NDJSON-Richtlinien v1
- Öffentliche Stammdaten: getrennte *.ndjson Files.
- User-bezogene Daten: pro User getrennte Files/Ordner.
- Version-Feld je Record (für Migrationen).
- Timestamps + UUID auf allen Entities.

## Auth/Admin v1
- Invite-Code/Invite-Link nur durch Admin erzeugbar.
- Registrierung nur mit gültiger Invite.
- Rollen: admin, user.

## Deliverables Sprint 0
- Entscheidung dokumentiert (dieses Dokument).
- Technisches Skeleton + leere Module + Interface-Contracts.
- Erste NDJSON Implementierung für User + Invite + Session.
- Basis-Auth-Flow: Invite -> Register -> Login.

## Sprint 0 Status (2026-05-19)
- ✓ pnpm workspace mit apps/web (Angular) + apps/api (Node.js).
- ✓ Angular PWA support aktiv.
- ✓ Feature-Libs: auth, training, nutrition, progress, admin.
- ✓ Data-access Libs (Repositories): auth, training, nutrition, progress, admin.
- ✓ Shared Libs: models, utils.
- ✓ Node API mit Express + TypeScript Basics.
- ✓ shared-models: alle Domain-Interfaces (User, Invite, Exercise, TrainingSession/Exercise/Set, FoodItem, NutritionDay/Entry).
- ✓ shared-models: generisches IRepository<T> Interface.
- ✓ shared-utils: UUID + Date utilities.
- ✓ API: IUserRepository + IInviteRepository Interfaces.
- ✓ API: NdjsonRepository<T> Basisklasse (generisch, austauschbar).
- ✓ API: NdjsonUserRepository + NdjsonInviteRepository.
- ✓ API: AuthService (bootstrapAdmin, createInvite, register, login).
- ✓ API: Auth Routes (POST /auth/bootstrap|invite|register|login).
- ✓ API: JWT + Passwort-Utils, requireAuth + requireAdmin Middleware.
- ✓ API: container.ts (Dependency wiring, DATA_DIR konfigurierbar).
- ✓ data-access-auth: IAuthService Interface, AuthService, authGuard, adminGuard, authInterceptor.
- ✓ Builds validiert: Angular ✓ | API ✓.

## Nächste Schritte (Phase 1 → 2)
- ✓ 3 separate Angular Apps im Workspace:
    - `app-shell` (Shell/User-PWA): Dashboard, Auth-Routing, Nutrition, Progress.
    - `app-training` (Training-App): fokussiert auf Session-Logging.
    - `app-admin` (Admin-App): Nutzer, Invites, Übungskatalog.
- ✓ Feature-Libs verdrahtet (lazy-loaded Routes, Guards).
- ✓ Alle 3 Apps + API bauen sauber.
- ✓ tsconfig paths zeigen auf Source (kein Lib-Pre-Build nötig).
- ✓ authInterceptor + authGuard/adminGuard in allen Apps aktiv.
- ✓ Shell-App liegt jetzt ebenfalls als echte Workspace-App unter `projects/app-shell`.

## Nächste Schritte
- ✓ feature-auth: Login/Register UI mit Signal Forms.
- ✓ pnpm root scripts für training/admin ergänzt.
- ✓ data-access-training: Angular Service (API-Calls) + Basis-Session-CRUD integriert.
- ✓ API: Training-Routen (Session CRUD).
- ✓ app-shell Dashboard durch echte Shell-Navigation ersetzt.
- ✓ Session-Detail ausgebaut: TrainingExercise + TrainingSet CRUD (API + data-access + UI).
- ✓ Fortschrittsanzeige für aktuell laufendes Training (completedSets/totalSets/%).
- ✓ Offline-Queue für Training-Write-Operationen (clientseitig localStorage + Online-Replay).

## Neue Anforderungen (Backlog, 2026-05-19)
- ✓ Trainingspläne als Vorlagen mit Laufzeit + Erinnerung bei auslaufendem Zeitraum (API + Dashboard Anzeige).
- ✓ Gewichtserhöhungsvorschläge bei Stagnation, inkl. konfigurierbare Regeln/Settings (API + Dashboard Anzeige).
- ✓ Dashboard Body-Heatmap je Trainingszyklus (trainierte Muskelgruppen-Verteilung).

## Next Hardening
- ✓ Offline-Queue conflict handling verbessert (Retry + Dead-letter Handling).
- ✓ Template-UI in Training-App (CRUD in Training-Overview) ergänzt.
- ✓ Stagnationslogik mit Volumen/Reps + Deload-Regeln verfeinert.
- ✓ Idempotency Keys fuer mutierende Training-Requests (API + Client + Replay).

## Frontend Delta
- ✓ feature-progress: Placeholder ersetzt durch echte Progress-Overview (Heatmap + Suggestions + letzte Sessions).

## Test Delta
- ✓ API Tests fuer Idempotency-Service und Route-Replay hinzugefuegt + ausgefuehrt.
