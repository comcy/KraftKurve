# Architecture: KraftKurve

## Decisions
- **2026-05-20: Micro-frontend integration in Shell**. [ADR-001](ADR-001.md)
  - Shell acts as the orchestrator for Admin, Training, and Nutrition apps.
- **2026-05-20: Zoneless Angular with Signals**.
  - Leveraging latest Angular performance features.
- **2026-05-20: Library-based feature organization**.
  - Separation of concerns: `feature-*` for UI logic, `data-access-*` for API/state, `shared-*` for common assets.
- **2026-05-21: Multi-App Workspace**.
  - Single pnpm workspace containing multiple Angular applications for modularity.
- **2026-05-21: Reactive Handling**.
  - Use of `ReplaySubject` and `takeUntilDestroy` for robust observable management.
- **2026-05-24: Normalized User Settings Storage**. [ADR-003](ADR-003.md)
  - Moving user preferences to dedicated NDJSON files linked by `userId`.
- **2026-05-24: Tactical Logbook Design System**. [ADR-004](ADR-004.md)
  - Transition to a high-contrast, data-centric "Cyber-Athletic" brutalist aesthetic.
