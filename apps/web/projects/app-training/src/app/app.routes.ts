import { Routes } from '@angular/router';
import { authGuard } from 'lib-auth-data-access';

export const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  {
    path: 'overview',
    canActivate: [authGuard],
    loadComponent: () => import('lib-training-feature-overview').then((m) => m.TrainingOverviewPage),
  },
  {
    path: 'session',
    canActivate: [authGuard],
    loadComponent: () => import('lib-training-feature-session').then((m) => m.TrainingSessionPage),
  },
  {
    path: 'session/:id',
    canActivate: [authGuard],
    loadComponent: () => import('lib-training-feature-session').then((m) => m.TrainingSessionPage),
  },
  { path: '**', redirectTo: 'overview' },
];
