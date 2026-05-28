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
- **2026-05-25: Paginated Nutrition History & Chart Aggregation**.
  - Backend support for time-series protein data (Week/Month/Year) and paginated entry logs.
- **2026-05-25: Layered UI Architecture (Stationary Background)**. [ADR-005](ADR-006.md)
  - Using `html::before` pseudo-elements for a fixed background grid independent of the scrolling viewport content.
- **2026-05-25: Comprehensive Identity & Access Management (IAM)**. [ADR-006](ADR-006.md)
  - Unified persistent auth across all apps using `localStorage`.
  - Strict separation: Management features exclusively in Web Admin UI, Mobile remains a lean tracking tool.
  - Invitation-only registration flow.
- **2026-05-28: Dashboard Intelligence & Workout Archive**.
  - Implementation of "Mission Control" dashboard providing quick access to the most recent session's tactical data.
  - Development of the "Workout Intel" component: a gesture-driven detailed view of historical training data.
