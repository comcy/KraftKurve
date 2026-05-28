# Lessons Learned: KraftKurve

## Index
1. [UI: Focus Loss in Iterative Inputs](#1-ui-focus-loss-in-iterative-inputs)
2. [Best Practices & Patterns](#2-best-practices--patterns)
   - [Angular Templates](#angular-templates)
   - [Theme & Global State](#theme--global-state)
   - [Security & Roles](#security--roles)
3. [Communication & UX Patterns](#3-communication--ux-patterns)

---

## 1. UI: Focus Loss in Iterative Inputs

### Problem
Users couldn't type more than one character into numeric preset fields in Settings. The input lost focus immediately after the first keystroke.

### Root Cause
- **Unstable DOM Tracking**: Using `*ngFor` or `@for` without a stable tracking mechanism (like `trackBy` or `track $index`).
- **Re-rendering Trigger**: On each keystroke, the bound array updated. Angular, unable to verify if the items were the same, destroyed the old DOM element and created a new one.
- **State Loss**: Re-creating the element causes the browser to lose the active focus state and virtual keyboard context.

### Prevention
- Always provide a stable identity for iterative elements.
- For primitive arrays (strings, numbers) or static-length lists, use `$index`.
- For entity lists, use a unique identifier (e.g., `item.id`).

---

## 2. Best Practices & Patterns

### Angular Templates
- **Modern Loops**: Use `@for` instead of `*ngFor`. It is more performant and requires a `track` statement by design.
- **Identity Tracking**: 
  - `track item.id` for business data.
  - `track $index` for UI-only arrays or fixed-size config inputs.
- **Input Modes**: Use `inputmode="decimal"` or `inputmode="numeric"` with `type="text"` to provide the best mobile keypad experience without the bugs of native number spinners.

### Theme & Global State
- **Early Execution**: Place theme-detection logic in a blocking `<script>` in `index.html`'s `<head>` to prevent "Light Mode Flash" (FOUC).
- **Service Initialization**: Inject core services like `ThemeService` into the `App` component's constructor to ensure state synchronization happens immediately on boot.

### Security & Roles
- **Role Inclusivity**: Ensure that "User-level" permissions are inclusive of the "Admin" role (e.g., `role === 'user' || role === 'admin'`). Blocking admins from tracking features is a common "Over-Locking" mistake.
- **Strict Separation**: Keep heavy management features (Admin UI) and lean tracking features (Mobile UI) in separate application bundles to maintain performance and focus.

### Intelligence & Progress
- **Subjective Intensity (RIR)**: Always provide a way for users to log "Reps In Reserve". This subjective data is critical for refining automated progression suggestions.
- **Dynamic Overload**: Implement progression strategies (Weight-focused vs. Rep-focused) as decoupled logic. This allows the system to adapt suggestions based on user preference and observed intensity (RIR).
- **Manual Confirmation**: Sets should start in an "Uncompleted" state. Requiring a manual "Check" acts as a user-verified commitment to the logged (or suggested) values, improving data quality.

---

## 3. Communication & UX Patterns
- **Zero Alert Policy**: Never use `window.alert()`. It blocks the main thread and feels unpolished. 
- **Tactical Feedback**: Use `MatSnackBar` with project-specific CSS classes (`kk-snackbar`) for all non-critical notifications.
