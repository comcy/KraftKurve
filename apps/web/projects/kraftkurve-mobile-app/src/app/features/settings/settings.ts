import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ThemeService, AppTheme } from 'shared-utils';
import { NutritionStateService } from '../../core/services/nutrition-state.service';
import { AuthService } from 'lib-auth-data-access';
import { TrainingService, OverloadStrategy } from 'lib-training-data-access';
import { Router } from '@angular/router';
import { I18nService } from 'lib-i18n';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private readonly _themeService = inject(ThemeService);
  private readonly _nutritionState = inject(NutritionStateService);
  private readonly _trainingApi = inject(TrainingService);
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _snackBar = inject(MatSnackBar);
  
  protected readonly i18n = inject(I18nService);
  protected readonly currentTheme = this._themeService.theme;
  protected readonly settings = this._nutritionState.settings;

  protected goalValue = signal<number>(0);
  protected presetValues = signal<number[]>([0, 0, 0]);
  protected overloadStrategy = signal<OverloadStrategy>('weight-focused');
  protected virtualTrainerEnabled = signal<boolean>(false);

  private _initialGoal = 0;
  private _initialPresets: number[] = [0, 0, 0];
  private _initialStrategy: OverloadStrategy = 'weight-focused';
  private _initialTrainerEnabled = false;

  protected readonly hasChanges = computed(() => {
    const currentGoal = Number(this.goalValue());
    const currentPresets = this.presetValues().map(v => Number(v));
    const currentStrategy = this.overloadStrategy();
    const currentTrainerEnabled = this.virtualTrainerEnabled();
    
    const goalChanged = currentGoal !== this._initialGoal;
    const presetsChanged = JSON.stringify(currentPresets) !== JSON.stringify(this._initialPresets);
    const strategyChanged = currentStrategy !== this._initialStrategy;
    const trainerChanged = currentTrainerEnabled !== this._initialTrainerEnabled;
    
    return goalChanged || presetsChanged || strategyChanged || trainerChanged;
  });

  async ngOnInit() {
    await this._nutritionState.loadToday();
    const current = this.settings();
    if (current) {
      const goal = current.proteinGoalG ?? 150;
      const presets = current.proteinPresets && current.proteinPresets.length === 3 
        ? [...current.proteinPresets] 
        : [20, 40, 60];

      this.goalValue.set(goal);
      this.presetValues.set(presets);
      
      this._initialGoal = goal;
      this._initialPresets = [...presets];
    }

    try {
      const tSettings = await this._trainingApi.getTrainingSettings();
      this.overloadStrategy.set(tSettings.overloadStrategy);
      this.virtualTrainerEnabled.set(tSettings.virtualTrainerEnabled);
      this._initialStrategy = tSettings.overloadStrategy;
      this._initialTrainerEnabled = tSettings.virtualTrainerEnabled;
    } catch {
      // ignore
    }
  }

  protected setTheme(theme: AppTheme) {
    this._themeService.setTheme(theme);
  }

  async saveConfiguration() {
    if (!this.hasChanges()) return;

    try {
      const goal = Number(this.goalValue());
      const presets = this.presetValues().map(v => Number(v));
      const strategy = this.overloadStrategy();
      const trainerEnabled = this.virtualTrainerEnabled();

      await Promise.all([
        this._nutritionState.updateSettings(goal, presets),
        this._trainingApi.updateTrainingSettings({ 
          strategy, 
          virtualTrainerEnabled: trainerEnabled 
        })
      ]);
      
      this._initialGoal = goal;
      this._initialPresets = [...presets];
      this._initialStrategy = strategy;
      this._initialTrainerEnabled = trainerEnabled;
      
      this._snackBar.open('KONFIGURATION GESPEICHERT', 'OK', {
        duration: 3000,
        panelClass: ['kk-snackbar']
      });
    } catch (err) {
      this._snackBar.open('FEHLER BEIM SPEICHERN', 'OK', {
        duration: 5000,
        panelClass: ['kk-snackbar-error']
      });
    }
  }

  async onLogout() {
    this._authService.logout();
    await this._router.navigate(['/auth/login']);
  }

  updatePreset(index: number, value: any) {
    const num = Number(value);
    const current = [...this.presetValues()];
    current[index] = num;
    this.presetValues.set(current);
  }
}
