import { Component, OnInit, inject, signal } from '@angular/core';
import {
  BodyHeatmapDto,
  StagnationSuggestionDto,
  TrainingService,
  TrainingSessionDto,
} from 'data-access-training';

@Component({
  selector: 'lib-progress-overview',
  template: `
    <main style="max-width:960px;margin:0 auto;padding:2rem 1rem;display:grid;gap:1rem">
      <h2 style="margin:0">Fortschritt</h2>

      @if (loading()) {
        <p>Lade Fortschritt...</p>
      }

      @if (error()) {
        <p style="margin:0;color:#b42318">{{ error() }}</p>
      }

      <section style="padding:0.8rem;border:1px solid #ded8c5;border-radius:0.75rem;background:#fffefb">
        <h3 style="margin-top:0">Heatmap ({{ heatmap().days }} Tage)</h3>
        <p style="margin:0 0 0.7rem">
          Completed sets: {{ heatmap().totalCompletedSets }} / {{ heatmap().totalSets }}
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.5rem">
          @for (row of heatmapRows(); track row.muscle) {
            <article style="border:1px solid #e5dcc0;border-radius:0.65rem;padding:0.6rem">
              <div style="font-weight:600;text-transform:capitalize">{{ row.muscle }}</div>
              <div style="font-size:0.9rem">{{ row.completed }} / {{ row.total }}</div>
              <div style="margin-top:0.4rem;height:8px;background:#eee6ce;border-radius:999px;overflow:hidden">
                <div [style.width.%]="row.percent" style="height:100%;background:#8a5e10"></div>
              </div>
            </article>
          }
        </div>
      </section>

      <section style="padding:0.8rem;border:1px solid #ded8c5;border-radius:0.75rem;background:#fffefb">
        <h3 style="margin-top:0">Stagnationsvorschlaege</h3>
        @if (!suggestions().length) {
          <p style="margin:0">Keine offenen Vorschlaege.</p>
        } @else {
          <ul style="margin:0;padding-left:1rem;display:grid;gap:0.35rem">
            @for (item of suggestions(); track item.exerciseName + item.muscleGroup) {
              <li>
                {{ item.exerciseName }}: {{ item.currentBestWeightKg }}kg -> {{ item.suggestedWeightKg }}kg
                ({{ item.suggestionType }}, completion {{ item.observedCompletionRatio * 100 }}%)
              </li>
            }
          </ul>
        }
      </section>

      <section style="padding:0.8rem;border:1px solid #ded8c5;border-radius:0.75rem;background:#fffefb">
        <h3 style="margin-top:0">Letzte Sessions</h3>
        @if (!sessions().length) {
          <p style="margin:0">Noch keine Sessions vorhanden.</p>
        } @else {
          <ul style="margin:0;padding-left:1rem;display:grid;gap:0.3rem">
            @for (session of sessions(); track session.id) {
              <li>
                {{ session.date }} - {{ session.templateType }}
                @if (session.finishedAt) { (done) } @else { (open) }
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
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
