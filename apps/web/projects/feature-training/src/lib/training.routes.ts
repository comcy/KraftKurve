import { Routes } from '@angular/router';

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./training-overview/training-overview.page').then(
        (m) => m.TrainingOverviewPage,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./training-session/training-session.page').then(
        (m) => m.TrainingSessionPage,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./training-session/training-session.page').then(
        (m) => m.TrainingSessionPage,
      ),
  },
];
