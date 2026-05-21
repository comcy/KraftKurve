# Angular Architecture: FluxFinance

## Workspace Structure
This project uses an Angular Monorepo approach with focused libraries and a main shell application.

### Projects
- **`flux-finance-app`**: The main shell application. Responsible for layout, global navigation, and authentication.
- **`core`**: Shared services (API, Storage, Theme) and global state.
- **`ui`**: Reusable presentational components and shared dialogs (Forms, Modals).
- **`features`**: Contains local features that are not yet externalized.

### Feature Libraries (Lazy-Loaded)
- Core domain features are isolated into their own libraries and loaded via `loadChildren` to optimize bundle size and enforce boundaries:
- **`dashboard`**: Home view with charts and summaries.
- **`transactions`**: The main data table with filtering and editing.
- **`categories`**: Hierarchy management and merging.
- **`taxes`**: Tax-relevant marking and year-based summaries.
- **`savings-plans`**: Investment tracking and interest projection.

## Design Patterns
- **Zoneless**: The application runs without Zone.js for better performance. Change detection is triggered explicitly or via signals.
- **Signals**: Used for state management (e.g., `ApiService.transactions`) and local component state.
- **Reactive Forms**: All user input is handled via `FormBuilder` and strongly typed forms.
- **Deep-Linking**: View state (filters, sort, pagination) is synchronized with URL query parameters.
- **Lazy-Loading**: All major features are loaded on-demand.

## Communication
- **API Aliases**: Libraries use `core` and `ui` aliases defined in `tsconfig.json`.
- **Inter-Library Dependencies**: Features may depend on `dashboard` for specific shared UI components (e.g., `LineChartComponent`).

## Performance & Bundle Optimization

### Current Status (May 2026)
- **Initial Bundle**: ~930kB (Raw) / ~225kB (Gzipped).
- **Lazy Loading**: Successfully implemented for all main features.
- **Zoneless**: Active, reducing overhead by ~30kB.

### Main Contributors to Initial Size
- **App Shell**: The main layout uses multiple Angular Material modules (`MatToolbar`, `MatMenu`, `MatBadge`) which are eagerly loaded.
- **Global Chart.js**: `provideCharts(withDefaultRegisterables())` in `app.config.ts` registers all chart types globally, increasing the base cost.
- **Monolithic UI Library**: `ui` library is imported by many features; if tree-shaking is imperfect, unused components might leak into chunks.

### Optimization Backlog
1. **Localize Chart Registration**: Move `withDefaultRegisterables()` or specific component registration into the libraries using charts (Dashboard, Contracts) instead of global config.
2. **Library Granularity**: Consider splitting `ui` into sub-entry points (e.g., `ui/buttons`, `ui/dialogs`) if the library grows, to ensure better tree-shaking.
3. **Shell Simplification**: Review the `App` component's dependencies and consider lazy-loading secondary UI elements (e.g., the Notification Center).
4. **SVG Icons**: Ensure only used Material Icons are bundled (using `MatIconRegistry` if needed instead of loading the full font).

