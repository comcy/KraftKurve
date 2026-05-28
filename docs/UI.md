# UI/UX Concept: Tactical Logbook

## Core Principles
- **Cyber-Athletic Aesthetic**: A fusion of high-tech tactical interfaces and physical archival logs.
- **Brutalism & Technical Skeuomorphism**: Structured grids, monospaced data, and archival metaphors.
- **Data-over-Decoration**: High legibility under physical strain, prioritizing numeric accuracy.
- **Mobile-first**: Optimized for modern devices (iPhone 15, tablets) with large touch targets (min 48x48px).

## Layout & Layering
- **Fixed Background Grid**: A stationary graph-paper pattern (`html::before`) that remains locked while content scrolls over it, simulating a desk surface.
- **Opaque Surfaces**: Header (`.app-header`) and Navigation (`.app-nav`) are 100% solid with heavy shadows (`0 4px 12px rgba(0,0,0,0.6)`) to ensure no scrolling content shines through.
- **Floating Widgets**: Cards and log entries appear as opaque "paper" layers moving on the grid.

## Typography
- **Headlines & Labels**: `Press Start 2P` for an 8-bit digital readout feel.
- **Body & Data**: `JetBrains Mono` for typewriter-style vertical alignment of numeric values.

## Components & Refinements
- **Log Cards**: 1px solid borders with 4px rounded corners and "tape" headers for section titles.
- **Tactical Inputs**: 
  - Numeric inputs use `type="text"` with `attr.inputmode="numeric|decimal"`.
  - Browser spinner buttons are hidden for a cleaner, data-centric look.
- **Nutrition Logic**:
  - **Unified Entry Widget**: Combines Quick-Track buttons and Custom Log form in a single archival card.
  - **Archival History**: Grouped list entries by date with sticky performance charts.
- **Training Intelligence**:
  - **Mission Control Dashboard**: Highlights the most recent session with immediate access to technical performance data (Intel).
  - **Workout Archive (Intel)**: Detailed swipe-up logs showing every set, weight, and repetition from past sessions, optimized for analytical review.
- **Gestural UI**: Bottom sheets feature a visual "Grab Handle" and support vertical swipe-to-dismiss functionality (via header/handle). Scrolling within the sheet is contained to the content area, keeping the header fixed.
- **Transparent Layering**: Sheet containers are 100% transparent during gestures, allowing the underlying tactical grid to show through seamlessly.
- **Bottom Sheets**: Custom full-width sheets (`kk-bottom-sheet`) for complex views like history, using a 90% screen height limit. Explicit close buttons are omitted to maximize data density.

## Color Palette
- **Primary (Yellow #fdff00)**: Active focus, primary actions.
- **Secondary (Magenta #ffabf3)**: Critical alerts, supersets.
- **Tertiary (Green #00ff41)**: Success, completion, positive trends.
- **Base (Black #131313)**: Main background, high-contrast canvas.
