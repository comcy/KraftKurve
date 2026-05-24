import { Routes } from '@angular/router';

export const NUTRITION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./nutrition-overview/nutrition-overview.page').then(
        (m) => m.NutritionOverviewPage,
      ),
  },
];
