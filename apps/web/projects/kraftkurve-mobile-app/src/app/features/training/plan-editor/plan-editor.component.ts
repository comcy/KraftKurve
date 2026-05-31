import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TrainingService, TrainingPlanDto, TrainingRoutineDto, TrainingSessionDto, TrainingRoutineExerciseDto } from 'lib-training-data-access';
import { TacticalDialogComponent } from '../../../core/components/tactical-dialog/tactical-dialog.component';

@Component({
  selector: 'app-plan-editor',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    MatButtonModule, 
    MatIconModule, 
    MatSlideToggleModule, 
    MatDialogModule,
    MatBottomSheetModule,
    DragDropModule,
    FormsModule
  ],
  templateUrl: './plan-editor.component.html',
  styleUrl: './plan-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly trainingApi = inject(TrainingService);
  private readonly router = inject(Router);
  private readonly _dialog = inject(MatDialog);
  private readonly _bottomSheet = inject(MatBottomSheet);

  protected readonly plan = signal<TrainingPlanDto | null>(null);
  protected readonly routines = signal<TrainingRoutineDto[]>([]);
  protected readonly routineExercises = signal<Record<string, TrainingRoutineExerciseDto[]>>({});
  protected readonly sessions = signal<TrainingSessionDto[]>([]);
  protected readonly loading = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadInitialData(id);
    }
  }

  async loadInitialData(id: string) {
    this.loading.set(true);
    try {
      const [plans, routines, sessions] = await Promise.all([
        this.trainingApi.listPlans(),
        this.trainingApi.listRoutines(id),
        this.trainingApi.listSessions()
      ]);
      
      const plan = plans.find(p => p.id === id);
      if (plan) {
        this.plan.set(plan);
        this.routines.set(routines);
        // Only finished sessions for this plan
        this.sessions.set(sessions.filter(s => s.planId === id && s.finishedAt !== null));

        // Load exercises for each routine
        const exMap: Record<string, TrainingRoutineExerciseDto[]> = {};
        for (const r of routines) {
          const exercises = await this.trainingApi.listRoutineExercises(r.id);
          exMap[r.id] = exercises;
        }
        this.routineExercises.set(exMap);
      }
    } catch {
      // ignore
    } finally {
      this.loading.set(false);
    }
  }

  async editPlan() {
    const p = this.plan();
    if (!p) return;

    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'PROTOCOL_OVERRIDE',
        message: 'Modify metadata for this training protocol.',
        fields: [
          { key: 'name', type: 'text', label: 'PROTOCOL NAME', value: p.name },
          { key: 'sessionsPerWeek', type: 'number', label: 'SESSIONS PER WEEK', value: p.sessionsPerWeek },
          { key: 'startDate', type: 'date', label: 'START DATE', value: p.startDate },
          { key: 'endDate', type: 'date', label: 'END DATE', value: p.endDate }
        ],
        confirmLabel: 'UPDATE'
      },
      panelClass: 'kk-dialog-panel'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result && result.name) {
      try {
        const updated = await this.trainingApi.updatePlan(p.id, {
          name: result.name,
          sessionsPerWeek: parseInt(result.sessionsPerWeek) || 3,
          startDate: result.startDate,
          endDate: result.endDate
        });
        this.plan.set(updated);
      } catch {
        // ignore
      }
    }
  }

  async openSessionDetail(sessionId: string) {
    const session = this.sessions().find(s => s.id === sessionId);
    if (!session) return;

    try {
      const exercises = await this.trainingApi.listExercises(sessionId);
      const { WorkoutDetailSheetComponent } = await import('lib-training-feature-details');
      this._bottomSheet.open(WorkoutDetailSheetComponent, {
        data: { session, exercises },
        panelClass: 'kk-bottom-sheet'
      });
    } catch {
      // ignore
    }
  }

  protected readonly planExecutionSequence = computed(() => {
    const p = this.plan();
    const routines = this.routines();
    const history = [...this.sessions()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    if (!p || routines.length === 0) return [];

    const result = [];
    
    // 1. Add completed sessions from actual history
    for (const sess of history) {
      const routine = routines.find(r => r.id === sess.routineId);
      result.push({
        id: sess.id,
        routineName: routine ? routine.name : (sess.planName || sess.templateType.toUpperCase()),
        date: sess.date,
        durationSeconds: sess.totalSeconds,
        status: 'completed'
      });
    }

    // 2. Calculate remaining slots based on sessions per week and duration
    const startDate = new Date(p.startDate);
    const endDate = new Date(p.endDate);
    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1;
    const totalTargetSlots = weeks * p.sessionsPerWeek;
    
    // Ensure we always show at least a few upcoming sessions if the plan is active
    const remainingSlots = Math.max(0, totalTargetSlots - history.length);
    const displayUpcoming = Math.max(remainingSlots > 0 ? remainingSlots : 0, 5); // Always show at least 5 upcoming if it's the current plan

    let nextIndex = 0;
    if (history.length > 0) {
      const lastRoutineId = history[history.length - 1].routineId;
      const lastIdx = routines.findIndex(r => r.id === lastRoutineId);
      nextIndex = (lastIdx + 1) % routines.length;
    }

    for (let i = 0; i < Math.min(displayUpcoming, 15); i++) {
      const idx = (nextIndex + i) % routines.length;
      result.push({
        id: `future-${i}`,
        routineName: routines[idx].name,
        status: 'pending'
      });
    }

    return result;
  });

  async addRoutine() {
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'ATTACH ROUTINE',
        message: 'Define the designation for this session template.',
        fields: [
          { key: 'name', type: 'text', label: 'ROUTINE NAME', placeholder: 'E.G. PUSH A' }
        ],
        confirmLabel: 'ATTACH'
      },
      panelClass: 'kk-dialog-panel'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result && result.name) {
      try {
        const routine = await this.trainingApi.createRoutine(this.plan()!.id, result.name);
        this.routines.update(list => [...list, routine]);
      } catch {
        // ignore
      }
    }
  }

  async deleteRoutine(id: string) {
    const dialogRef = this._dialog.open(TacticalDialogComponent, {
      data: {
        title: 'DESTROY ROUTINE',
        message: 'Confirm removal of this routine template from the archive. This action is irreversible.',
        confirmLabel: 'DESTROY'
      },
      panelClass: 'kk-dialog-panel'
    });

    const confirmed = await firstValueFrom(dialogRef.afterClosed());
    if (confirmed) {
      try {
        await this.trainingApi.deleteRoutine(id);
        this.routines.update(list => list.filter(r => r.id !== id));
      } catch {
        // ignore
      }
    }
  }

  async onDrop(event: CdkDragDrop<TrainingRoutineDto[]>) {
    const list = [...this.routines()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.routines.set(list);
    
    // Persist sequence order
    for (let i = 0; i < list.length; i++) {
      await this.trainingApi.updateRoutine(list[i].id, list[i].name, i + 1);
    }
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${minutes}m ${s}s`;
  }
}
