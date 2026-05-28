import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'lib-auth-data-access';
import { NutritionService } from 'lib-nutrition-data-access';
import { TrainingService, OverloadStrategy } from 'lib-training-data-access';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css',
})
export class ProfilePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly nutritionService = inject(NutritionService);
  private readonly trainingService = inject(TrainingService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly displayName = signal('');
  protected readonly email = signal('');
  protected readonly proteinGoalDraft = signal<number | null>(null);
  protected readonly proteinPresetsDraft = signal<number[]>([20, 40, 60]);
  protected readonly overloadStrategyDraft = signal<OverloadStrategy>('weight-focused');

  async ngOnInit(): Promise<void> {
    const user = this.authService.getCurrentUser();
    this.displayName.set(user?.displayName ?? '');
    this.email.set(user?.email ?? '');

    if (user?.role === 'admin') {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const [nSettings, tSettings] = await Promise.all([
        this.nutritionService.getSettings(),
        this.trainingService.getTrainingSettings(),
      ]);

      this.proteinGoalDraft.set(nSettings.proteinGoalG);
      if (nSettings.proteinPresets && nSettings.proteinPresets.length === 3) {
        this.proteinPresetsDraft.set([...nSettings.proteinPresets]);
      }
      this.overloadStrategyDraft.set(tSettings.overloadStrategy);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Profil konnte nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  protected isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'admin';
  }

  protected updatePreset(index: number, value: string): void {
    const num = parseInt(value) || 0;
    const current = [...this.proteinPresetsDraft()];
    current[index] = num;
    this.proteinPresetsDraft.set(current);
  }

  protected async saveSettings(event: Event): Promise<void> {
    event.preventDefault();
    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const goal = this.proteinGoalDraft();
      if (goal !== null && (Number.isNaN(goal) || goal < 1 || goal > 9999)) {
        this.error.set('Ziel muss zwischen 1g und 9999g sein.');
        return;
      }

      const presets = this.proteinPresetsDraft();
      if (presets.some(p => p < 1 || p > 999)) {
        this.error.set('Presets muessen zwischen 1g und 999g sein.');
        return;
      }

      await Promise.all([
        this.nutritionService.updateSettings({
          proteinGoalG: goal,
          proteinPresets: presets,
        }),
        this.trainingService.updateTrainingSettings(this.overloadStrategyDraft()),
      ]);

      this.success.set('Einstellungen gespeichert.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Speichern fehlgeschlagen.');
    } finally {
      this.saving.set(false);
    }
  }

  protected clearGoal(): void {
    this.proteinGoalDraft.set(null);
  }
}
