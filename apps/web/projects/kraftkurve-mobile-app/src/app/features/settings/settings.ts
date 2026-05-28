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
import { ThemeService } from 'shared-utils';
import { NutritionStateService } from '../../core/services/nutrition-state.service';
import { AuthService } from 'lib-auth-data-access';
import { TrainingService, OverloadStrategy } from 'lib-training-data-access';
import { Router } from '@angular/router';

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
  
  protected readonly settingsTitle = 'USER PROTOCOL';
  protected readonly themeMode = 'VISUAL OVERRIDE';
  protected readonly fuelConfig = 'FUEL CONFIGURATION';
  protected readonly trainingConfig = 'TRAINING PROTOCOL';
  protected readonly accountConfig = 'ACCOUNT PROTOCOL';
  protected readonly dark = 'DARK';
  protected readonly light = 'LIGHT';

  protected readonly currentTheme = this._themeService.theme;
  protected readonly settings = this._nutritionState.settings;

  protected goalValue = signal<number>(0);
  protected presetValues = signal<number[]>([0, 0, 0]);
  protected overloadStrategy = signal<OverloadStrategy>('weight-focused');

  private _initialGoal = 0;
  private _initialPresets: number[] = [0, 0, 0];
  private _initialStrategy: OverloadStrategy = 'weight-focused';

  protected readonly hasChanges = computed(() => {
    const currentGoal = Number(this.goalValue());
    const currentPresets = this.presetValues().map(v => Number(v));
    const currentStrategy = this.overloadStrategy();
    
    const goalChanged = currentGoal !== this._initialGoal;
    const presetsChanged = JSON.stringify(currentPresets) !== JSON.stringify(this._initialPresets);
    const strategyChanged = currentStrategy !== this._initialStrategy;
    
    return goalChanged || presetsChanged || strategyChanged;
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
      this._initialStrategy = tSettings.overloadStrategy;
    } catch {
      // ignore
    }
  }

  protected toggleTheme() {
    this._themeService.toggleTheme();
  }

  async saveConfiguration() {
    if (!this.hasChanges()) return;

    try {
      const goal = Number(this.goalValue());
      const presets = this.presetValues().map(v => Number(v));
      const strategy = this.overloadStrategy();

      await Promise.all([
        this._nutritionState.updateSettings(goal, presets),
        this._trainingApi.updateTrainingSettings(strategy)
      ]);
      
      this._initialGoal = goal;
      this._initialPresets = [...presets];
      this._initialStrategy = strategy;
      
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
