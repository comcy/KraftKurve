import { Routes } from '@angular/router';
import { adminGuard } from 'lib-auth-data-access';

/**
 * These are the inner routes of the Admin app.
 */
export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('lib-admin-feature-dashboard').then((m) => m.AdminDashboardPage),
    data: { breadcrumb: 'Dashboard' }
  },
  {
    path: 'invites',
    loadComponent: () => import('lib-admin-feature-invite-codes').then((m) => m.InviteCodesPage),
    data: { breadcrumb: 'Invites' }
  },
  {
    path: 'users',
    loadComponent: () => import('lib-admin-feature-user-list').then((m) => m.UserListPage),
    data: { breadcrumb: 'Nutzer' }
  },
  {
    path: 'exercises',
    loadComponent: () => import('lib-admin-feature-exercise-catalog').then((m) => m.ExerciseCatalogPage),
    data: { breadcrumb: 'Katalog' }
  },
];

/**
 * Main export for Shell and Standalone.
 * The Shell uses 'loadChildren' which expects this array.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app').then(m => m.App),
    canActivate: [adminGuard],
    children: adminRoutes
  }
];
