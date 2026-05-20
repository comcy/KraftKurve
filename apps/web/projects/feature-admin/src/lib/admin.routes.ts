import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.page').then(
        (m) => m.AdminDashboardPage,
      ),
  },
  {
    path: 'invites',
    loadComponent: () =>
      import('./invite-codes/invite-codes.page').then((m) => m.InviteCodesPage),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./user-list/user-list.page').then((m) => m.UserListPage),
  },
  {
    path: 'exercises',
    loadComponent: () =>
      import('./exercise-catalog/exercise-catalog.page').then(
        (m) => m.ExerciseCatalogPage,
      ),
  },
];
