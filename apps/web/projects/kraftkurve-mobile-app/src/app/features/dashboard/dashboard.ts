import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NutritionStateService } from '../../core/services/nutrition-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly nutritionState = inject(NutritionStateService);

  protected readonly systemOnline = 'SYSTEM ONLINE';
  protected readonly version = 'V.2.4.1';
  protected readonly engageProtocol = 'ENGAGE PROTOCOL';
  protected readonly scheduled = 'SCHEDULED';
  protected readonly freestyle = 'FREESTYLE';
  protected readonly fuelStatus = 'FUEL STATUS';
  protected readonly protein = 'PROTEIN';
  protected readonly strengthIndex = 'STRENGTH INDEX';
  protected readonly startWorkout = 'START WORKOUT';

  // Real data from service
  protected readonly proteinCurrent = this.nutritionState.totalProtein;
  protected readonly proteinTarget = this.nutritionState.proteinGoal;
  protected readonly proteinPercentage = this.nutritionState.proteinPercentage;
  protected readonly presets = computed(() => this.nutritionState.settings()?.proteinPresets ?? [10, 25, 50]);

  ngOnInit() {
    this.nutritionState.loadToday();
  }

  async onQuickLog(amount: number) {
    await this.nutritionState.quickLog(amount);
  }
}

import { computed } from '@angular/core';
