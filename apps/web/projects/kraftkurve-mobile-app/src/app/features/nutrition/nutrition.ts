import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { FormsModule } from '@angular/forms';
import { NutritionStateService } from '../../core/services/nutrition-state.service';
import { NutritionHistorySheetComponent } from './nutrition-history-sheet.component';

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatBottomSheetModule,
    FormsModule
  ],
  templateUrl: './nutrition.html',
  styleUrl: './nutrition.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NutritionComponent implements OnInit {
  private readonly nutritionState = inject(NutritionStateService);
  private readonly bottomSheet = inject(MatBottomSheet);

  protected readonly fuelProtocol = 'NUTRITION PROTOCOL';
  protected readonly dailyIntake = 'DAILY INTAKE';
  protected readonly quickLogLabel = 'QUICK LOG';
  protected readonly customLogLabel = 'CUSTOM LOG';
  protected readonly historyLabel = 'LOG HISTORY';
  protected readonly weekIndexLabel = '7-DAY STRENGTH INDEX';

  protected readonly proteinCurrent = this.nutritionState.totalProtein;
  protected readonly proteinTarget = this.nutritionState.proteinGoal;
  protected readonly proteinPercentage = this.nutritionState.proteinPercentage;
  protected readonly presets = computed(() => this.nutritionState.settings()?.proteinPresets ?? [10, 25, 50]);

  protected customProtein = signal<number | null>(null);
  protected weeklyHistory = signal<any[]>([]);

  async ngOnInit() {
    await this.nutritionState.loadToday();
    const history = await this.nutritionState.getWeeklyHistory();
    this.weeklyHistory.set(history);
  }

  async onQuickLog(amount: number) {
    await this.nutritionState.quickLog(amount);
    // Refresh history too
    const history = await this.nutritionState.getWeeklyHistory();
    this.weeklyHistory.set(history);
  }

  async onCustomLog() {
    const amount = this.customProtein();
    if (amount && amount > 0) {
      await this.nutritionState.logCustom('Manual Entry', amount);
      this.customProtein.set(null);
      const history = await this.nutritionState.getWeeklyHistory();
      this.weeklyHistory.set(history);
    }
  }

  showHistory() {
    this.bottomSheet.open(NutritionHistorySheetComponent);
  }

  // Helper for chart
  getBarHeight(total: number): string {
    const goal = this.proteinTarget() || 150;
    const pct = Math.min(100, (total / goal) * 100);
    return `${pct}%`;
  }

  getDayLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  }
}
