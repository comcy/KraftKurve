# User Story: Shell Application (Corporate Frame)

As a user, I want a consistent frame for the entire system so that I can easily navigate between different features and manage my session.

## Description
The Shell app is the main entry point and orchestrator. It provides the global layout, navigation, and common services like authentication and theme management.

## Acceptance Criteria

### Functional
- [ ] Displays a persistent header with the KraftKurve logo and icon.
- [ ] Provides top-level navigation to Dashboard, Training, Nutrition, and Progress.
- [ ] Role-based navigation: "Admin" menu is only visible to users with 'ADMIN' role.
- [ ] User profile icon with dropdown menu (Profile, Logout).
- [ ] Theme switcher (Light/Dark mode) in the header.
- [ ] Handles global authentication state and redirects to login if unauthenticated.
- [ ] Responsive design for mobile and tablet.

### Non-Functional
- [ ] Uses Angular Material components for the UI.
- [ ] Implements Zoneless change detection.
- [ ] Follows strict SCSS theme guidelines.
- [ ] Logic implemented in standalone components.
