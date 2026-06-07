# UI/UX Concept: KraftKurve

## Themes
Three switchable themes, selectable in Settings → Appearance:

| Theme | Class | Feel |
|---|---|---|
| **Tactical** (default) | `theme-tactical` | Cyber-athletic brutalism, `Press Start 2P` + `JetBrains Mono`, neon-on-black, sharp corners, no shadows |
| **Minimal Dark** | `theme-minimal-dark` | Premium minimal, `Inter`, indigo/violet palette, slate-navy bg, `12px` radius, soft shadows |
| **Minimal Light** | `theme-minimal-light` | Same as Minimal Dark but slate-white bg |

Theme class is applied to `<html>` by `ThemeService`. A bootstrap inline script in `index.html` pre-applies the class before Angular initializes to prevent flash. CSS custom properties cascade from `:root.theme-*` to all children.

## Design Tokens (CSS Custom Properties)
All theme-specific values live as CSS vars on `:root.theme-*`. Key tokens:

| Token | Tactical | Minimal |
|---|---|---|
| `--font-headline` | Press Start 2P | Inter |
| `--font-body` | JetBrains Mono | Inter |
| `--card-radius` | `0.25rem` | `0.75rem` |
| `--shadow-card` | none | `0 1px 3px rgba(0,0,0,0.08)` |
| `--primary` | `#fdff00` yellow | `#4F46E5` / `#818CF8` indigo |
| `--background` | `#131313` | `#F8FAFC` / `#0F172A` |
| `--nav-label-size` | 8px | 11px |

## Tactical Theme: Core Principles
- **Cyber-Athletic Aesthetic**: fusion of tactical interfaces and physical archival logs.
- **Brutalism & Technical Skeuomorphism**: structured grids, monospaced data, archival metaphors.
- **Data-over-Decoration**: high legibility under physical strain.
- **Fixed Background Grid**: `html::before` graph-paper pattern (locked while content scrolls).
- **Opaque Surfaces**: Header + Nav 100% solid with heavy shadows to separate layers.

## Minimal Theme: Core Principles
- **Minimalist Premium**: clean whitespace, Inter typography, refined hierarchy.
- **Soft depth**: `box-shadow` on cards (`--shadow-card`), no background grid.
- **No uppercase coercion**: headlines and labels display in natural case.
- **Rounded components**: all cards, buttons, inputs use `border-radius: var(--card-radius)`.

## Typography (Global Utility Classes)
Classes use `var(--font-headline)` / `var(--font-body)` — theme switches font automatically.

| Class | Tactical | Minimal |
|---|---|---|
| `.headline-xl` | PS2P 32px uppercase | Inter 28px 700, normal case |
| `.headline-lg` | PS2P 20px uppercase | Inter 22px 600, normal case |
| `.headline-md` | PS2P 16px uppercase | Inter 17px 600, normal case |
| `.label-caps` | PS2P 8px uppercase | Inter 11px 500, uppercase |
| `.data-mono` | JetBrains Mono 18px 700 | Inter 20px 700 |

## Material Components
Angular Material M3 theme bakes in `Press Start 2P`/`JetBrains Mono` as static CSS.
Overrides are applied for minimal themes via:
- MDC CSS token overrides (`--mdc-filled-text-field-input-text-font`, etc.)
- Direct `!important` rules on `.mat-mdc-button`, `.mdc-text-field__input`, `.mat-mdc-option`, etc.

Buttons in minimal theme: `14px`, `font-weight: 500`, `text-transform: none`, `border-radius: var(--radius-md)`.

## Icons (Material Symbols)
`mat-icon` is globally forced to `font-family: 'Material Symbols Outlined' !important` with:
- `text-transform: none !important` — prevents parent button `uppercase` from breaking ligature icon names
- `font-weight: normal !important` — prevents bold inheritance from corrupting icon weight axis
- `letter-spacing: normal !important` — prevents spacing from breaking glyph rendering

## Layout
- **Header**: Fixed, 120px, header logo `max-height: 100px`, icon buttons flank center logo.
- **Content**: Padded 130px top / 120px bottom, max-width 600px centered.
- **Bottom Nav**: Fixed 84px, tab icons 24px, label via `var(--nav-label-size)`.
- **Scroll**: No horizontal scroll enforced via `overflow-x: hidden` on `html` + `body`.

## Components

### Log Cards (`.log-card`)
- Background: `--surface-container-lowest`
- Border: 1px `--outline-variant`
- Radius: `var(--card-radius)` (0px tactical, 12px minimal)
- Shadow: `var(--shadow-card)` (none tactical, soft shadow minimal)
- `.log-header.tape`: sticky tape label strip (tactical) / simple row (minimal)

### Superset Blocks
- 2px `--secondary` border container with tab label.

### Bottom Sheets (`kk-bottom-sheet`)
- Full-width, transparent container, grab handle + swipe-to-dismiss.

### Tactical Dialog
- Only dialog type used app-wide. `TacticalDialogComponent` via `MatDialog`.
- 1px `--primary` border, square corners (tactical).

### Navigation (Bottom Tab)
- Icons: `mat-icon` 24px.
- Labels: `var(--font-headline)` at `var(--nav-label-size)`.
- Active state: `--primary-alt` color + 4px bottom border.

## AI Suggestions (Virtual Trainer)
- Electric Orange `#ff9100` for AI-proposed values with subtle glow.
- Pre-filled inputs persist orange highlight until changed.

## Cardio Tracking
- Dynamic form per exercise category: duration (m/s), distance (m), BPM, calories.

## Color Palette

### Tactical Dark
- Primary: `#fdff00` yellow — active focus, primary actions
- Secondary: `#ffabf3` magenta — critical alerts, superset grouping
- Tertiary: `#00ff41` green — success, completion
- Base: `#131313` — main background

### Minimal Dark
- Primary: `#818CF8` indigo — actions, focus
- Secondary: `#A78BFA` violet — secondary actions
- Tertiary: `#34D399` emerald — success
- Base: `#0F172A` slate navy

### Minimal Light
- Primary: `#4F46E5` indigo
- Secondary: `#7C3AED` purple
- Tertiary: `#059669` emerald
- Base: `#F8FAFC` slate white
