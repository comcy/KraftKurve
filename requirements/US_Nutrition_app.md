# User Story: Nutrition Tracker Application

As a user, I want to track my daily protein intake so that I can reach my nutritional goals.

## Description

The Nutrition app focuses on protein tracking and daily intake goals. 
The user can log entries via quick-track presets or manual custom entries.
A comprehensive history view provides insights into past performance via charts and grouped logs.

## Acceptance Criteria

- [x] **Unified Log Widget**: Quick Log presets and Custom Log form are combined in a single card for efficiency.
- [x] **Daily Progress**: Visual progress bar for daily intake vs. goal.
- [x] **Grouped History**: Swipe-up history page (90% height) showing entries grouped by date.
- [x] **Sticky Optimization**: A tactical chart remains fixed at the top of the history page.
- [x] **Goal Visualization**: History charts include a horizontal target line representing the daily protein goal. Bars are color-coded (Green) when the goal is achieved.
- [x] **Gesture Support**: The history swipe-up page supports native-like swipe-down gestures to close (via drag handle or header), ensuring a completely immersive mobile experience.
- [x] **Goal Analytics**: History charts feature a minimalist target line with a right-aligned numeric label and success-based color coding.
- [x] **Focused History UI**: Removed explicit close buttons in favor of intuitive gestures and high-contrast drag handles.
- [x] **Independent Scrolling**: Historical logs are contained in a dedicated scrollable area, preventing header drift and scroll leakage.
- [x] **Pagination**: Infinite scroll or "Load More" for historical entry logs.
- [x] **Mobile Optimization**: High touch targets and clear data-centric layout.

## Non-Functional
- [x] Fast "one-click" logging for common items.
- [x] Brutalist aesthetic (Tape headers, mono fonts).
- [x] Persistent state via backend storage.
