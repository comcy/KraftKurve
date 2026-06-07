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
- **Superset Blocks**: Integrated containers with solid **Magenta borders** (`var(--secondary)`) that unify multiple exercises into a single logical unit.
- **Tactical Dialog Terminal**: A custom UI replacement for all native popups, supporting multiple fields (date pickers, selects, text) while maintaining the archival look.
- **Workout Details Archive**: 
  - Detailed swipe-up logs showing every set, weight, and repetition from past sessions.
  - **Execution Accuracy**: Distinct visualization for performed (checkmark) vs. skipped (strikethrough) sets.
  - **Plan Context**: Automated display of Protocol and Routine names in log headers.
- **Plan Configuration Details**:
  - Routine cards feature an **Exercise Preview Stack** showing the first 5 movements in the protocol.
  - **Execution Sequence Visuals**: A visual timeline in the plan editor that merges historical session completions (Tertiary Green) with upcoming projections.
- **Optimization Sequencing**: Dynamic suggestions for the "Next Routine" based on historical completion and predefined protocol order.
- **Gestural UI**: Bottom sheets feature a visual "Grab Handle" and support vertical swipe-to-dismiss functionality (via header/handle). Scrolling within the sheet is contained to the content area, keeping the header fixed.
- **Transparent Layering**: Sheet containers are 100% transparent during gestures, allowing the underlying tactical grid to show through seamlessly.
- **Bottom Sheets**: Custom full-width sheets (`kk-bottom-sheet`) for complex views like history, using a 90% screen height limit. 
- **Tactical Interaction**: Primary lists (Today's Operations, Dashboard metrics) are clickable entry points to the Details Sheet.
- **Dialog Aesthetics**: Tactual dialogs utilize a fine **1px** solid border of the Primary color for a high-tech, precise look.

## AI-Assisted Optimization (Virtual Trainer)
- **Color-Coded Suggestions**: Values suggested by the Virtual Trainer are displayed with a distinct **Electric Orange #ff9100** (AI Optimization color) with a subtle glow.
- **Pre-fill Interaction**: Input fields for Weight and Reps are pre-filled with suggested values. The orange highlight persists until the value is changed or confirmed.
- **Global Goal Badges**: Exercise headers feature a "Proposed Protocol" badge in the planning and active session views.

## Tracking Specialized Payloads (Cardio)
- **Dynamic Forms**: Exercises categorized under 'Cardio' replace the set list with a structured log for duration (minutes/seconds), distance (meters), intensity (avg BPM), and metabolic cost (calories).

## Color Palette
- **Primary (Yellow #fdff00)**: Active focus, primary actions.
- **Secondary (Magenta #ffabf3)**: Critical alerts, superset grouping.
- **Tertiary (Green #00ff41)**: Success, completion, finished operations.
- **Base (Black #131313)**: Main background, high-contrast canvas.
