import { Routes } from '@angular/router';

export const PROGRESS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./progress-overview/progress-overview.page').then(
        (m) => m.ProgressOverviewPage,
      ),
  },
];
