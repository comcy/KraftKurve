import { Routes } from '@angular/router';
import { authGuard, userGuard } from 'data-access-auth';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('feature-auth').then((m) => m.AUTH_ROUTES),
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
    canActivate: [authGuard, userGuard],
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  { path: '**', redirectTo: 'dashboard' },
];
