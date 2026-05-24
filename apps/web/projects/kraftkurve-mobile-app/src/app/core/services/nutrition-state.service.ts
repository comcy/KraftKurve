import { Injectable, inject, signal, computed } from '@angular/core';
import { NutritionService, DaySummaryDto, NutritionSettingsDto, NutritionEntryDto } from 'lib-nutrition-data-access';
import { firstValueFrom, BehaviorSubject, map, switchMap, timer, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NutritionStateService {
  private readonly nutritionApi = inject(NutritionService);

  // Use signals for UI state
  private readonly _summary = signal<DaySummaryDto | null>(null);
  private readonly _settings = signal<NutritionSettingsDto | null>(null);
  private readonly _loading = signal<boolean>(false);

  readonly summary = computed(() => this._summary());
  readonly settings = computed(() => this._settings());
  readonly loading = computed(() => this._loading());

  // Derived signals
  readonly totalProtein = computed(() => this._summary()?.totalProteinG ?? 0);
  readonly proteinGoal = computed(() => this._settings()?.proteinGoalG ?? this._summary()?.proteinGoalG ?? 0);
  readonly proteinPercentage = computed(() => {
    const goal = this.proteinGoal();
    if (goal <= 0) return 0;
    return Math.min(100, (this.totalProtein() / goal) * 100);
  });

  async loadToday() {
    this._loading.set(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [summary, settings] = await Promise.all([
        this.nutritionApi.getDaySummary(today),
        this.nutritionApi.getSettings()
      ]);
      this._summary.set(summary);
      this._settings.set(settings);
    } catch (error) {
      console.error('Failed to load nutrition data', error);
    } finally {
      this._loading.set(false);
    }
  }

  async quickLog(proteinG: number) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await this.nutritionApi.createEntry({
        date: today,
        name: 'Quick Log',
        mealType: 'snack',
        portionG: 0,
        proteinG
      });
      await this.loadToday(); // Refresh
    } catch (error) {
      console.error('Log failed', error);
      throw error;
    }
  }

  async logCustom(name: string, proteinG: number) {
    const today = new Date().toISOString().split('T')[0];
    try {
      await this.nutritionApi.createEntry({
        date: today,
        name,
        mealType: 'snack',
        portionG: 0,
        proteinG
      });
      await this.loadToday();
    } catch (error) {
      console.error('Custom log failed', error);
      throw error;
    }
  }

  async updateSettings(proteinGoalG?: number | null, proteinPresets?: number[]) {
    try {
      const newSettings = await this.nutritionApi.updateSettings({ proteinGoalG, proteinPresets });
      this._settings.set(newSettings);
      await this.loadToday();
    } catch (error) {
      console.error('Operation failed', error);
      throw error;
    }
  }

  async getWeeklyHistory() {
    // Requirements: chart showing last 7 days.
    // We'll fetch them individually for now as the API is single-day.
    const history = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      try {
        const s = await this.nutritionApi.getDaySummary(dateStr);
        history.push(s);
      } catch {
        history.push({ date: dateStr, totalProteinG: 0, entries: [], proteinGoalG: null });
      }
    }
    return history.reverse();
  }
}
