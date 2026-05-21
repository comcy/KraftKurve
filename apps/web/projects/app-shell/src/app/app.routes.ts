import { Routes } from '@angular/router';
import { authGuard, userGuard, adminGuard } from 'data-access-auth';
import { RoleRedirectComponent } from './role-redirect.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: RoleRedirectComponent,
  },
  {
    path: 'auth',
    loadChildren: () => import('feature-auth').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('feature-admin').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, userGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'training',
    canActivate: [authGuard, userGuard],
    loadChildren: () => import('feature-training').then((m) => m.TRAINING_ROUTES),
  },
  {
    path: 'nutrition',
    canActivate: [authGuard, userGuard],
    loadChildren: () => import('feature-nutrition').then((m) => m.NUTRITION_ROUTES),
  },
  {
    path: 'progress',
    canActivate: [authGuard, userGuard],
    loadChildren: () => import('feature-progress').then((m) => m.PROGRESS_ROUTES),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  { path: '**', redirectTo: '' },
];

