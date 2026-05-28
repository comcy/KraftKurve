import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { TrainingStateService } from '../../core/services/training-state.service';
import { TrainingService, TrainingPlanDto, TrainingSessionDto } from 'lib-training-data-access';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatRippleModule, FormsModule],
  templateUrl: './training.html',
  styleUrl: './training.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingComponent implements OnInit {
  private readonly _trainingState = inject(TrainingStateService);
  private readonly _trainingApi = inject(TrainingService);

  protected readonly activeSession = this._trainingState.activeSession;
  protected readonly isPaused = this._trainingState.isPaused;
  protected readonly exercises = this._trainingState.exercises;
  protected readonly duration = this._trainingState.durationFormatted;
  protected readonly suggestions = this._trainingState.suggestions;
  
  protected readonly workoutTitle = 'WORKOUT TERMINAL';
  protected readonly addSetLabel = 'ADD SET';
  protected readonly finishWorkoutLabel = 'FINISH WORKOUT';
  protected readonly startWorkoutLabel = 'START FREE WORKOUT';

  protected availablePlans = signal<TrainingPlanDto[]>([]);
  protected todaySessions = signal<TrainingSessionDto[]>([]);
  protected showPlanSelector = signal(true);

  async ngOnInit() {
    await this._trainingState.init();
    await this.loadInitialData();
  }

  private async loadInitialData() {
    try {
      const [plans, sessions] = await Promise.all([
        this._trainingApi.listPlans(),
        this._trainingApi.listSessions()
      ]);
      this.availablePlans.set(plans.filter(p => p.active));
      
      const today = new Date().toISOString().split('T')[0];
      this.todaySessions.set(sessions.filter(s => s.date === today));
      
      if (this.activeSession()) {
        this.showPlanSelector.set(false);
      }
    } catch {
      // ignore
    }
  }

  async startFreeWorkout() {
    await this._trainingState.startSession();
    this.showPlanSelector.set(false);
  }

  async startPlanWorkout(planId: string) {
    await this._trainingState.startSession(planId);
    this.showPlanSelector.set(false);
  }

  async resumeSession(session: TrainingSessionDto) {
    await this._trainingState.resumeSession(session);
    this.showPlanSelector.set(false);
  }

  async onAddExercise() {
    const name = prompt('Exercise Name?');
    if (name) {
      await this._trainingState.addExercise(name, 'full-body');
    }
  }

  async onAddSet(exerciseId: string) {
    const sets = this.getSetsForExercise(exerciseId);
    let reps = 10;
    let weight = 0;

    if (sets.length > 0) {
      const last = sets[sets.length - 1];
      reps = last.reps;
      weight = last.weightKg;
    } else {
      const suggestion = this.suggestions()[exerciseId];
      if (suggestion) {
        reps = suggestion.suggestedTarget.reps;
        weight = suggestion.suggestedTarget.weightKg;
      }
    }

    await this._trainingState.addSet(exerciseId, reps, weight);
  }

  async onUpdateSet(exerciseId: string, setId: string, reps: string, weight: string, rir?: string) {
    const r = parseInt(reps) || 0;
    const w = parseFloat(weight) || 0;
    const ri = rir !== undefined && rir !== '' ? (parseInt(rir) || 0) : null;
    await this._trainingState.updateSet(exerciseId, setId, r, w, ri);
  }

  async toggleSetDone(exerciseId: string, set: any) {
    await this._trainingState.updateSet(exerciseId, set.id, set.reps, set.weightKg, set.rir, !set.done);
  }

  async togglePause() {
    if (this.isPaused()) {
      await this._trainingState.resumeActiveSession();
    } else {
      await this._trainingState.pauseSession();
    }
  }

  async onFinish() {
    if (confirm('Finish this workout?')) {
      await this._trainingState.finishSession();
      this.showPlanSelector.set(true);
      await this.loadInitialData();
    }
  }

  getSetsForExercise(exerciseId: string) {
    return this._trainingState.setsByExercise()[exerciseId] || [];
  }
}
