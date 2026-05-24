import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { AuthService, IfPermissionDirective, Permission } from 'lib-auth-data-access';
import {
  BodyHeatmapDto,
  StagnationSuggestionDto,
  TrainingPlanTemplateReminderDto,
  TrainingService,
} from 'lib-training-data-access';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule,
    MatListModule,
    IfPermissionDirective,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly trainingService = inject(TrainingService);
  private readonly auth = inject(AuthService);

  // App Launchers
  protected readonly apps = [
    { label: 'Training', icon: 'fitness_center', route: '/training', color: '#607d8b', permission: 'TRACK_TRAINING' as Permission },
    { label: 'Nutrition', icon: 'restaurant', route: '/nutrition', color: '#ff9800', permission: 'TRACK_NUTRITION' as Permission },
    { label: 'Progress', icon: 'show_chart', route: '/progress', color: '#4caf50', permission: 'VIEW_PROGRESS' as Permission },
  ];

  protected readonly isAdmin = () => this.auth.getCurrentUser()?.role === 'admin';

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly reminders = signal<TrainingPlanTemplateReminderDto[]>([]);
  protected readonly suggestions = signal<StagnationSuggestionDto[]>([]);
  protected readonly heatmap = signal<BodyHeatmapDto>({
    days: 28,
    totalSets: 0,
    totalCompletedSets: 0,
    muscles: {
      chest: { totalSets: 0, completedSets: 0 },
      back: { totalSets: 0, completedSets: 0 },
      shoulders: { totalSets: 0, completedSets: 0 },
      biceps: { totalSets: 0, completedSets: 0 },
      triceps: { totalSets: 0, completedSets: 0 },
      forearms: { totalSets: 0, completedSets: 0 },
      abs: { totalSets: 0, completedSets: 0 },
      glutes: { totalSets: 0, completedSets: 0 },
      quads: { totalSets: 0, completedSets: 0 },
      hamstrings: { totalSets: 0, completedSets: 0 },
      calves: { totalSets: 0, completedSets: 0 },
      'full-body': { totalSets: 0, completedSets: 0 },
      cardio: { totalSets: 0, completedSets: 0 },
    },
  });

  protected readonly heatmapRows = signal<
    Array<{ muscle: string; total: number; completed: number; percent: number }>
  >([]);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [reminders, suggestions, heatmap] = await Promise.all([
        this.trainingService.getTemplateReminders(14),
        this.trainingService.getStagnationSuggestions(3, 2.5, 2, 0.65, 0.1),
        this.trainingService.getBodyHeatmap(28),
      ]);
      this.reminders.set(reminders);
      this.suggestions.set(suggestions);
      this.heatmap.set(heatmap);
      this.heatmapRows.set(
        Object.entries(heatmap.muscles).map(([muscle, entry]) => ({
          muscle,
          total: entry.totalSets,
          completed: entry.completedSets,
          percent: entry.totalSets === 0 ? 0 : Math.round((entry.completedSets / entry.totalSets) * 100),
        })),
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Dashboard konnte nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }
}
