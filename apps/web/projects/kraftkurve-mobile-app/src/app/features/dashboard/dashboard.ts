import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { NutritionStateService } from '../../core/services/nutrition-state.service';
import { TrainingService, TrainingSessionDto, TrainingExerciseDto } from 'lib-training-data-access';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatBottomSheetModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly nutritionState = inject(NutritionStateService);
  private readonly trainingApi = inject(TrainingService);
  private readonly bottomSheet = inject(MatBottomSheet);

  protected readonly fuelStatus = 'FUEL STATUS';
  protected readonly protein = 'PROTEIN';
  protected readonly lastWorkoutLabel = 'LAST WORKOUT';
  protected readonly startWorkout = 'START WORKOUT';

  // Nutrition data
  protected readonly proteinCurrent = this.nutritionState.totalProtein;
  protected readonly proteinTarget = this.nutritionState.proteinGoal;
  protected readonly proteinPercentage = this.nutritionState.proteinPercentage;
  protected readonly presets = computed(() => this.nutritionState.settings()?.proteinPresets ?? [10, 25, 50]);

  // Training data
  protected readonly lastSession = signal<TrainingSessionDto | null>(null);
  protected readonly lastSessionExercises = signal<TrainingExerciseDto[]>([]);

  async ngOnInit() {
    this.nutritionState.loadToday();
    await this.loadLastWorkout();
  }

  private async loadLastWorkout() {
    try {
      const sessions = await this.trainingApi.listSessions();
      if (sessions.length > 0) {
        // sessions are sorted by date desc from API
        const last = sessions[0];
        this.lastSession.set(last);
        const exercises = await this.trainingApi.listExercises(last.id);
        this.lastSessionExercises.set(exercises);
      }
    } catch {
      // ignore
    }
  }

  async onQuickLog(amount: number) {
    await this.nutritionState.quickLog(amount);
  }

  async openWorkoutDetail(session: TrainingSessionDto) {
    const { WorkoutDetailSheetComponent } = await import('./workout-detail-sheet.component');
    this.bottomSheet.open(WorkoutDetailSheetComponent, {
      data: { session, exercises: this.lastSessionExercises() },
      panelClass: 'kk-bottom-sheet'
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }
}
