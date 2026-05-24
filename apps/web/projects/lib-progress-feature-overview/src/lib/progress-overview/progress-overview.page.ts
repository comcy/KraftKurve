import { Component, OnInit, inject, signal } from '@angular/core';
import {
  BodyHeatmapDto,
  StagnationSuggestionDto,
  TrainingService,
  TrainingSessionDto,
} from 'lib-training-data-access';

@Component({
  selector: 'lib-progress-overview',
  templateUrl: './progress-overview.page.html',
  styleUrl: './progress-overview.page.scss',
  imports: [CommonModule, MatProgressBarModule, MatCardModule, MatChipsModule, MatListModule, MatIconModule],
})
export class ProgressOverviewPage implements OnInit {
  private readonly trainingService = inject(TrainingService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly sessions = signal<TrainingSessionDto[]>([]);
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
      const [sessions, suggestions, heatmap] = await Promise.all([
        this.trainingService.listSessions(),
        this.trainingService.getStagnationSuggestions(3, 2.5, 2, 0.65, 0.1),
        this.trainingService.getBodyHeatmap(28),
      ]);

      this.sessions.set(sessions.slice(0, 12));
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
      this.error.set(error instanceof Error ? error.message : 'Fortschritt konnte nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }
}
