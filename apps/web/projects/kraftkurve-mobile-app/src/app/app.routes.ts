import { Routes } from '@angular/router';
import { authGuard } from 'lib-auth-data-access';
import { DashboardComponent } from './features/dashboard/dashboard';
import { TrainingComponent } from './features/training/training';
import { NutritionComponent } from './features/nutrition/nutrition';
import { ProgressComponent } from './features/progress/progress';
import { SettingsComponent } from './features/settings/settings';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { 
        path: 'training', 
        children: [
          { path: '', redirectTo: 'terminal', pathMatch: 'full' },
          { path: 'terminal', component: TrainingComponent },
          { 
            path: 'plans', 
            loadComponent: () => import('./features/training/plan-list/plan-list.component').then(m => m.PlanListComponent) 
          },
          { 
            path: 'plans/:id', 
            loadComponent: () => import('./features/training/plan-editor/plan-editor.component').then(m => m.PlanEditorComponent) 
          },
          { 
            path: 'plans/:id/routines/:routineId', 
            loadComponent: () => import('./features/training/routine-editor/routine-editor.component').then(m => m.RoutineEditorComponent) 
          }
        ]
      },
      { path: 'nutrition', component: NutritionComponent },
      { path: 'progress', component: ProgressComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('lib-auth-feature-login').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('lib-auth-feature-register').then((m) => m.RegisterPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
