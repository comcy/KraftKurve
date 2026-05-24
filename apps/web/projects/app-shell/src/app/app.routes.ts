import { Routes } from '@angular/router';
import { authGuard, userGuard, adminGuard } from 'lib-auth-data-access';
import { RoleRedirectComponent } from './role-redirect.component';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: RoleRedirectComponent,
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('lib-auth-feature-login').then((m) => [
        { path: 'login', component: m.LoginPage },
        {
          path: 'register',
          loadComponent: () =>
            import('lib-auth-feature-register').then((m) => m.RegisterPage),
        },
      ]),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      loadRemoteModule('appAdmin', './Routes').then((m) => m.routes),
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
    loadChildren: () =>
      loadRemoteModule('appTraining', './Routes').then((m) => m.routes),
  },
  {
    path: 'nutrition',
    canActivate: [authGuard, userGuard],
    loadChildren: () =>
      loadRemoteModule('appNutrition', './Routes').then((m) => m.routes),
  },
  {
    path: 'progress',
    canActivate: [authGuard, userGuard],
    loadComponent: () =>
      import('lib-progress-feature-overview').then((m) => m.ProgressOverviewPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.page').then((m) => m.ProfilePage),
  },
  { path: '**', redirectTo: '' },
];

