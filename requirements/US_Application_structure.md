# User Story: Administration and Training UI

1. There are different apps: "shell", "admin", "training", "nutrition"
2. Each app can be started separately, where "admin" and "training" represents microservice applications, the "shell" contains the corporate frame of the system:
    - shell: contains the page header icon, the "login" (and "logout"), the top header navigation for switching between apps (admin, training, nutrition), a user profile icon, a theme switcher, has a content where the content of the app is loaded into
    - admin: maintaining settings and user management for the whole system - only admins can access
    - training: the training tracker application itself - available for every valid user of the system
    - nutrition: the nutrition tracker application itself - available for every valid user of the system
3. Visibility and roles: Admins can be also Users of the system and can see navigation items for all apps, where simple users only can access apps

## Acceptance Criteria

### Functional
- [ ] Shell app provides a global header with navigation to Admin, Training, and Nutrition.
- [ ] Theme switcher in the shell toggles between Light and Dark modes.
- [ ] Admin app is restricted to users with the 'ADMIN' role.
- [ ] Training and Nutrition apps are accessible to all authenticated users.
- [ ] Navigation menu items are hidden/shown based on user roles.
- [ ] Apps (admin, training, nutrition) can be served independently via Angular CLI.

### Non-Functional
- [ ] Use Angular Material for UI components.
- [ ] Responsive design for mobile (iPhone 15+) and tablet (iPad 10"+).
- [ ] Zoneless Angular setup.
- [ ] SCSS for styling.
- [ ] Standalone components only.