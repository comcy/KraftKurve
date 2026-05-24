---
name: Tactical Logbook
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#cac8aa'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#939277'
  outline-variant: '#484831'
  surface-tint: '#cccd00'
  primary: '#ffffff'
  on-primary: '#323200'
  primary-container: '#e9ea00'
  on-primary-container: '#676800'
  inverse-primary: '#616200'
  secondary: '#ffabf3'
  on-secondary: '#5b005b'
  secondary-container: '#fe00fe'
  on-secondary-container: '#500050'
  tertiary: '#ffffff'
  on-tertiary: '#003907'
  tertiary-container: '#72ff70'
  on-tertiary-container: '#007518'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ea00'
  primary-fixed-dim: '#cccd00'
  on-primary-fixed: '#1d1d00'
  on-primary-fixed-variant: '#494900'
  secondary-fixed: '#ffd7f5'
  secondary-fixed-dim: '#ffabf3'
  on-secondary-fixed: '#380038'
  on-secondary-fixed-variant: '#810081'
  tertiary-fixed: '#72ff70'
  tertiary-fixed-dim: '#00e639'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#00530e'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Press Start 2P
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.05em
  headline-lg:
    fontFamily: Press Start 2P
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Press Start 2P
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Press Start 2P
    fontSize: 8px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: 0px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  journal-offset: 48px
---

## Brand & Style

This design system translates a "Cyber-Athletic" aesthetic into a digital field journal. It is a fusion of **high-tech tactical interfaces** and **physical archival logs**. The personality is precise, cold, and disciplined, evoking the feeling of a special-ops operative recording biometric performance data in a high-consequence environment.

The visual style is a blend of **Brutalism** and **Technical Skeuomorphism**. It utilizes structured grids, monospaced data, and archival metaphors. Rather than soft shadows, it uses physical cues like "tape" headers, "punched hole" margins, and "ring-binder" edges to ground the digital experience in a tangible, archival format. The aesthetic prioritizes "Data-over-Decoration," ensuring high legibility under the strain of physical training. While the foundations are brutalist, subtle rounding on primary containers provides a modern "machined" finish.

## Colors

The palette is anchored in a deep black (`#131313`), providing a high-contrast canvas that reduces eye strain in low-light gym environments. 

- **Primary (Yellow):** The high-visibility focal point (`#fdff00`). Used for active system states, primary navigation, and "Log Entry" focus.
- **Secondary (Magenta):** Reserved specifically for "Supersets" and critical performance warnings.
- **Tertiary (Green):** The success indicator (`#00ff41`). Used for completed sets, "Start" actions, and positive trend data.
- **Surface Neutrals:** A subtle dot-grid or square-grid pattern in `#1f1f1f` should be applied to the main background to simulate graph paper. Containers use `#0a0a0a` to create a tiered "layered paper" effect without relying on shadows.

## Typography

The typography system creates a contrast between "Structural Headers," "Interface Labels," and "Recorded Data." 

- **Headlines:** Utilize **Press Start 2P**. This 8-bit aesthetic provides a "low-res digital readout" feel, used for section headers and major navigation titles. The pixelated nature reinforces the digital-tactical theme.
- **System Labels:** Utilize **Press Start 2P**. This is used for UI plumbing, button labels, and metadata categories to emphasize the digital-logbook nature of the app.
- **Body & Data:** Utilize **JetBrains Mono**. This monospaced choice simulates the "Typewriter" or "Hand-Log" aesthetic, ensuring all numeric data (weight, reps, time) aligns vertically in columns for instant scannability.
- **Archival Notes:** For user-generated notes, use a slightly smaller `body-md` size to differentiate from system-generated instructions.

## Layout & Spacing

The layout is governed by a strict **12-column fixed grid** on desktop and a **single-column fluid grid** on mobile. 

All touch targets must be a minimum of 48x48px, acknowledging the diminished fine-motor control during heavy physical exertion.

Spacing is tight and systematic, favoring "Information Density" over expansive whitespace. Elements are grouped in "Log Blocks" with 4px gutters between internal data points and 16px margins between major entries.

## Elevation & Depth

This system has ambient shadows and blurs. Depth is achieved through **Tonal Layering** and **Graphic Outlines**:

- **Tier 1 (Base):** The `#131313` background with a subtle `#1f1f1f` graph-paper grid.
- **Tier 2 (Containers):** `#0a0a0a` surfaces with a 1px solid border (`#333333`).
- **Tier 3 (Active/Focus):** A 2px solid border using the Primary or Tertiary accent color.
- **Archival Accents:** "Tape" effects are used for headers—these are solid rectangular blocks of `#2a2a2a` that "overlap" the container borders, creating a physical "stuck-on" appearance.

## Shapes

The shape language utilizes a **Soft (4px)** corner radius for most interface elements. 

While the system retains its technical, industrial, and "cut paper" aesthetic, elements like buttons, cards, and input fields feature subtle rounding (0.25rem) to suggest a precision-machined or manufactured quality rather than raw, unfinished edges. 

The primary exceptions are:
- **Archival Elements:** "Tape" headers and overlapping labels remain sharp (0px) to preserve the look of torn or cut adhesive strips.
- **Hole Punches:** Circular punches in the journal sidebar are perfect circles.
- **Ring Binders:** Semi-circular arcs for the binder spine motif.

## Components

### Cards & Log Entries
Cards represent a single exercise or data set. They feature a 1px border and 4px rounded corners. They include a "Tape" header—a sharp-edged dark grey bar where the exercise name (e.g., "SQUAT - A1") is placed in `label-caps` (Press Start 2P). The left edge of the card should feature a vertical line with three "punched hole" circles to reinforce the notebook theme.

### Buttons
Buttons are high-contrast blocks with 4px rounded corners.
- **Primary:** Solid Yellow (`#fdff00`) background with black `label-caps` text.
- **Success (Start/Complete):** Solid Green background.
- **Ghost:** No fill, 2px border in the accent color.

### Inputs & Checkboxes
Inputs are styled as boxes with subtle 4px rounding and a persistent `_` underscore cursor effect. Checkboxes for marking sets as "Complete" are square boxes with 4px rounding that, when checked, fill with a solid Green "X" or block.

### Supersets (The Folder Group)
When exercises are grouped as a superset, they are enclosed in a secondary frame with a **Magenta** border and 4px rounding. A small sharp-edged "tab" should extend from the top or side of this frame, like a folder tab, containing the superset ID in `label-caps`.

### Progress Charts
Charts should use the dot-grid background and render data as crisp, non-curved "Step" lines or "Histogram" bars using the Primary Yellow. No gradients; use hatch-pattern fills for area charts.