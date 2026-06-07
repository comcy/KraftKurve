# Plan: Multi-Theme System + Progress Analytics

## Goal
Add Progress analytics (workout calendar, muscle load) and a 3-theme design system (Tactical / Minimal Dark / Minimal Light) switchable in Settings.

## Steps
1. [x] Add API endpoints: `GET /training/progress/heatmap` + `GET /training/progress/calendar`
2. [x] Create `lib-progress-data-access` (ProgressService, DTOs)
3. [x] Create `lib-progress-feature-overview` (ProgressOverviewComponent — calendar heatmap + muscle load bars)
4. [x] Lazy-load progress route in `app.routes.ts`
5. [x] Fix horizontal scroll bug: CSS overflow protection + shortened German i18n strings
6. [x] Expand ThemeService: `'dark'|'light'` → `AppTheme = 'tactical'|'minimal-dark'|'minimal-light'`; add `setTheme()`; backward-compat migration
7. [x] Update `index.html`: load Inter font, update bootstrap script for new class names
8. [x] Update `styles.scss`: rename `:root.dark` → `.theme-tactical`, add minimal theme variable blocks (Inter, indigo palette, rounded corners, shadows), CSS var overrides for Material components
9. [x] Update Settings UI: replace slide-toggle with 3-button theme selector
10. [x] Add new i18n keys for theme names (all 3 locales + translation-keys.ts)
11. [x] Fix icon ligature breakage: add `text-transform: none !important` to global mat-icon rule
12. [x] Fix Material M3 baked-in fonts: add MDC CSS token overrides + explicit form/button !important rules for minimal themes
13. [x] Larger header logo (80px → 100px); theme-aware nav label size via `--nav-label-size` CSS var

## Status
Complete.

## Unresolved Questions
- None currently open.
