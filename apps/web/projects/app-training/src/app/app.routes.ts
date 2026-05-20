import { Routes } from '@angular/router';
import { authGuard } from 'data-access-auth';

export const routes: Routes = [
  { path: '', redirectTo: 'session', pathMatch: 'full' },
  {
    path: 'session',
    canActivate: [authGuard],
    loadChildren: () => import('feature-training').then((m) => m.TRAINING_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('feature-auth').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: 'session' },
];
