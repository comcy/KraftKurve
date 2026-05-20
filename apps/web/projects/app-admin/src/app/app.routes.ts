import { Routes } from '@angular/router';
import { adminGuard } from 'data-access-auth';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('feature-auth').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    loadChildren: () => import('feature-admin').then((m) => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: 'dashboard' },
];
