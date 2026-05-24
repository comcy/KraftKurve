import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme';
import { NutritionStateService } from '../../core/services/nutrition-state.service';

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
    FormsModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  private readonly _themeService = inject(ThemeService);
  private readonly _nutritionState = inject(NutritionStateService);
  
  protected readonly settingsTitle = 'USER PROTOCOL';
  protected readonly themeMode = 'VISUAL OVERRIDE';
  protected readonly fuelConfig = 'FUEL CONFIGURATION';
  protected readonly dark = 'DARK';
  protected readonly light = 'LIGHT';

  protected readonly currentTheme = this._themeService.theme;
  protected readonly settings = this._nutritionState.settings;

  protected goalValue = signal<number>(0);
  protected presetValues = signal<number[]>([0, 0, 0]);

  async ngOnInit() {
    await this._nutritionState.loadToday();
    const current = this.settings();
    if (current) {
      // Use 150 as a sensible default if none is set yet, to avoid min(1) validation error
      this.goalValue.set(current.proteinGoalG ?? 150);
      this.presetValues.set(current.proteinPresets && current.proteinPresets.length === 3 
        ? [...current.proteinPresets] 
        : [20, 40, 60]);
    }
  }

  protected toggleTheme() {
    this._themeService.toggleTheme();
  }

  async saveFuelSettings() {
    try {
      await this._nutritionState.updateSettings(this.goalValue(), this.presetValues());
      // Simple alert for feedback
      alert('Konfiguration gespeichert!');
    } catch (err) {
      alert('Fehler beim Speichern: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    }
  }

  updatePreset(index: number, value: number) {
    const current = [...this.presetValues()];
    current[index] = value;
    this.presetValues.set(current);
  }
}
