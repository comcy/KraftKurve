# Plan: Micro-frontend Integration

Integrated entrance via Shell (Port 4200). Role-based redirection to Admin or User features.

## Steps
1. [x] Create `RoleRedirectComponent` in Shell for root path `/`.
2. [x] Update Shell routes to include `ADMIN_ROUTES` and `TRAINING_ROUTES` from libs.
3. [x] Refactor Shell navigation to adapt to role.
4. [ ] Verify deep-linking works for both roles.
5. [ ] Cleanup: standalone `app-admin` and `app-training` remain as dev-only or are removed.

## Unresolved Questions
- Should `/dashboard` be shared or role-specific?
- Do we keep dedicated ports 4201/4202 or focus entirely on 4200?
