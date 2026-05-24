import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard';
import { TrainingComponent } from './features/training/training';
import { NutritionComponent } from './features/nutrition/nutrition';
import { ProgressComponent } from './features/progress/progress';
import { SettingsComponent } from './features/settings/settings';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'training', component: TrainingComponent },
  { path: 'nutrition', component: NutritionComponent },
  { path: 'progress', component: ProgressComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' }
];
