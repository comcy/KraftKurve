import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BodyHeatmapDto,
  StagnationSuggestionDto,
  TrainingPlanTemplateReminderDto,
  TrainingService,
} from 'data-access-training';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <main style="max-width:980px;margin:0 auto;padding:1.2rem 1rem 2rem;display:grid;gap:1rem">
      <section style="display:flex;justify-content:space-between;gap:1rem;align-items:end;flex-wrap:wrap">
        <div>
          <h1 style="margin:0 0 0.2rem">KraftKurve Dashboard</h1>
          <p style="margin:0;color:#5f5f5f">Live Uebersicht fuer laufenden Zyklus</p>
        </div>
        <a routerLink="/training/new" style="padding:0.5rem 0.75rem;background:#2b1c00;color:#fff;text-decoration:none;border-radius:0.6rem">+ Training starten</a>
      </section>

      @if (loading()) {
        <p>Lade Dashboard...</p>
      }

      @if (error()) {
        <p style="color:#b42318">{{ error() }}</p>
      }

      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0.8rem">
        <article style="padding:0.9rem;border:1px solid #ded8c5;border-radius:0.8rem;background:#fffefb">
          <h3 style="margin-top:0">Template Erinnerungen</h3>
          @if (!reminders().length) {
            <p style="margin:0;color:#666">Keine auslaufenden Vorlagen.</p>
          } @else {
            <ul style="margin:0;padding-left:1rem;display:grid;gap:0.35rem">
              @for (item of reminders(); track item.templateId) {
                <li>
                  {{ item.templateName }} -
                  @if (item.status === 'expired') {
                    abgelaufen seit {{ -item.daysRemaining }} Tagen
                  } @else {
                    endet in {{ item.daysRemaining }} Tagen
                  }
                </li>
              }
            </ul>
          }
        </article>

        <article style="padding:0.9rem;border:1px solid #ded8c5;border-radius:0.8rem;background:#fffefb">
          <h3 style="margin-top:0">Gewichtsvorschlaege bei Stagnation</h3>
          @if (!suggestions().length) {
            <p style="margin:0;color:#666">Keine Stagnation erkannt.</p>
          } @else {
            <ul style="margin:0;padding-left:1rem;display:grid;gap:0.35rem">
              @for (suggestion of suggestions(); track suggestion.exerciseName + suggestion.muscleGroup) {
                <li>
                  {{ suggestion.exerciseName }}:
                  {{ suggestion.currentBestWeightKg }}kg -> {{ suggestion.suggestedWeightKg }}kg
                  ({{ suggestion.suggestionType }}, completion {{ suggestion.observedCompletionRatio * 100 }}%)
                </li>
              }
            </ul>
          }
        </article>
      </section>

      <section style="padding:0.9rem;border:1px solid #ded8c5;border-radius:0.8rem;background:#fffefb">
        <h3 style="margin-top:0">Body Heatmap ({{ heatmap().days }} Tage)</h3>
        <p style="margin:0 0 0.7rem;color:#444">
          Gesamt: {{ heatmap().totalCompletedSets }} / {{ heatmap().totalSets }} erledigte Saetze
        </p>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.6rem">
          @for (row of heatmapRows(); track row.muscle) {
            <article style="border:1px solid #e9e2cc;border-radius:0.65rem;padding:0.6rem;background:#fffcf2">
              <div style="font-weight:600;text-transform:capitalize">{{ row.muscle }}</div>
              <div style="font-size:0.9rem;color:#444">{{ row.completed }} / {{ row.total }} done</div>
              <div style="height:8px;background:#ece7d8;border-radius:999px;overflow:hidden;margin-top:0.4rem">
                <div
                  style="height:100%;background:linear-gradient(90deg,#5d4100,#b1842b)"
                  [style.width.%]="row.percent"
                ></div>
              </div>
            </article>
          }
        </div>
      </section>

      <section style="display:flex;gap:0.6rem;flex-wrap:wrap">
        <a routerLink="/training" style="padding:0.45rem 0.65rem;border:1px solid #d4cbaa;border-radius:0.55rem;text-decoration:none;color:#2b2b2b">Zum Training</a>
        <a routerLink="/nutrition" style="padding:0.45rem 0.65rem;border:1px solid #d4cbaa;border-radius:0.55rem;text-decoration:none;color:#2b2b2b">Zur Nutrition</a>
      </section>
    </main>
  `,
})
export class DashboardPage implements OnInit {
  private readonly trainingService = inject(TrainingService);

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
