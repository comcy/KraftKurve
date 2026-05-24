# Iterations Log

## 2026-05-24: Tactical Logbook Design & Normalized Storage
- **Design System**: Overhauled global styles and components with "Cyber-Athletic" brutalist aesthetic. Integrated `Press Start 2P` and `JetBrains Mono` fonts.
- **UI Refinement**: Removed notebook sidebar motif and punched holes for a cleaner, centered layout across all features.
- **Proxy Standardisation**: Standardized `proxy.conf.json` and updated `angular.json` for all apps to ensure reliable backend connectivity (fixing 404 saving errors).
- **Data Normalization**: Refactored user settings into a dedicated `nutrition-settings.ndjson` file, using `userId` as a foreign key. Updated backend service, repository, and container logic.
- **Documentation**: Synchronized all technical docs, including README, Architecture mapping, UI concept, and created new ADRs (003 & 004).
- **Bug Fixes**: Resolved naming mismatches in backend repositories that caused boot failures.
