import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TrainingStateService } from '../../core/services/training-state.service';
import { TrainingService, TrainingPlanDto, TrainingSessionDto, ExerciseDto, TrainingRoutineDto, TrainingExerciseDto } from 'lib-training-data-access';
import { TacticalDialogComponent } from '../../core/components/tactical-dialog/tactical-dialog.component';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    MatButtonModule, 
    MatIconModule, 
    MatRippleModule, 
    MatDialogModule,
    MatBottomSheetModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './training.html',
  styleUrl: './training.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrainingComponent implements OnInit {
  private readonly _trainingState = inject(TrainingStateService);
  private readonly _trainingApi = inject(TrainingService);
  private readonly _dialog = inject(MatDialog);
  private readonly _bottomSheet = inject(MatBottomSheet);

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
  protected catalog = signal<ExerciseDto[]>([]);
  protected showPlanSelector = signal(true);

  protected activePlansWithNextRoutine = signal<Array<{ plan: TrainingPlanDto, nextRoutine: TrainingRoutineDto | null }>>([]);

  protected readonly groupedExercises = computed(() => {
    const list = this.exercises();
    const groups: Array<{ type: 'single' | 'superset', exercises: TrainingExerciseDto[] }> = [];
    
    for (let i = 0; i < list.length; i++) {
      const current = list[i];
      if (current.supersetGroupId) {
        // Find if we already have a group with this ID
        const existingGroup = groups.find(g => g.type === 'superset' && g.exercises[0].supersetGroupId === current.supersetGroupId);
        if (existingGroup) {
          existingGroup.exercises.push(current);
        } else {
          groups.push({ type: 'superset', exercises: [current] });
        }
      } else {
        groups.push({ type: 'single', exercises: [current] });
      }
    }
    return groups;
  });

  async ngOnInit() {
    await this._trainingState.init();
    await this.loadInitialData();
  }

  private async loadInitialData() {
    const today = new Date().toISOString().split('T')[0];
    const localToday = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    try {
      const [plans, sessions, catalog] = await Promise.all([
        this._trainingApi.listPlans(),
        this._trainingApi.listSessions(),
        this._trainingApi.listCatalog()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const localToday = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      this.catalog.set(catalog);
      this.availablePlans.set(plans);
      this.todaySessions.set(sessions.filter(s => s.date === today || s.date === localToday));

      // Filter active plans - MUST be active AND within timeframe
      const activePlans = plans
        .filter(p => {
          if (!p.active) return false;
          const isStarted = p.startDate <= today || p.startDate <= localToday;
          const isNotEnded = p.endDate >= today || p.endDate >= localToday;
          return isStarted && isNotEnded;
        })
        .sort((a, b) => b.startDate.localeCompare(a.startDate)); // Newest first

      // Enrich with next routine information
      const enrichedPlans = await Promise.all(activePlans.map(async (plan) => {
        try {
          const nextRoutine = await this._trainingState.getNextRoutine(plan.id);
          return { plan, nextRoutine };
        } catch (e) {
          return { plan, nextRoutine: null };
        }
      }));

      this.activePlansWithNextRoutine.set(enrichedPlans);

      if (this.activeSession()) {
        this.showPlanSelector.set(false);
      }
    } catch (err) {
      console.error('Critical failure in Training Hub initialization:', err);
    }
  }

  async startFreeWorkout() {
    await this._trainingState.startSession();
    this.showPlanSelector.set(false);
  }

  async startPlanWorkout(planId: string, routineId: string) {
    await this._trainingState.startSession(planId, routineId);
    this.showPlanSelector.set(false);
  }

  async resumeSession(session: TrainingSessionDto) {
    await this._trainingState.resumeSession(session);
    this.showPlanSelector.set(false);
  }

  async openWorkoutDetail(session: TrainingSessionDto) {
    try {
      const exercises = await this._trainingApi.listExercises(session.id);
      const { WorkoutDetailSheetComponent } = await import('lib-training-feature-details');
      this._bottomSheet.open(WorkoutDetailSheetComponent, {
        data: { session, exercises },
        panelClass: 'kk-bottom-sheet'
      });
    } catch {
      // ignore
    }
  }

  async onAddExercise() {
    const existingNames = this.exercises().map(e => e.exerciseName.toLowerCase());
    
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'ATTACH EXERCISE',
        message: 'Search for existing data or define new movement.',
        fields: [
          { 
            key: 'name', 
            type: 'text', 
            label: 'EXERCISE NAME', 
            placeholder: 'E.G. BENCH PRESS',
            autocompleteOptions: this.catalog()
              .map(e => e.name)
              .filter(name => !existingNames.includes(name.toLowerCase()))
          }
        ],
        confirmLabel: 'ATTACH'
      },
      panelClass: 'kk-dialog-panel'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result && result.name) {
      const normalizedNewName = result.name.trim().toLowerCase();
      if (existingNames.includes(normalizedNewName)) {
        // Prevent redundant attachments
        return;
      }

      await this._trainingState.addExercise(result.name, 'full-body');
      await this.loadInitialData(); // Refresh catalog
    }
  }

  async onDeleteExercise(exerciseId: string, name: string) {
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'DETACH EXERCISE',
        message: `Confirm removal of ${name.toUpperCase()} from current operation. All logged sets will be destroyed.`,
        confirmLabel: 'DETACH'
      },
      panelClass: 'kk-dialog-panel'
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await this._trainingState.deleteExercise(exerciseId);
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
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'TERMINATE WORKOUT',
        message: 'Are you sure you want to finish and archive this session?',
        confirmLabel: 'FINISH'
      },
      panelClass: 'kk-dialog-panel'
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      await this._trainingState.finishSession();
      this.showPlanSelector.set(true);
      await this.loadInitialData();
    }
  }

  getSetsForExercise(exerciseId: string) {
    return this._trainingState.setsByExercise()[exerciseId] || [];
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${s}s`;
    return `${s}s`;
  }

  isSupersetWithPrev(index: number): boolean {
    const list = this.exercises();
    return !!(list[index].supersetGroupId && list[index - 1] && list[index].supersetGroupId === list[index - 1].supersetGroupId);
  }
}
