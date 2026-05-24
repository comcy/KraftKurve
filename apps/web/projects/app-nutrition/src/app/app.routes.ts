import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('lib-nutrition-feature-overview').then(m => m.NutritionOverviewPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
