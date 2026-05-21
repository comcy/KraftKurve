import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MuscleGroup,
  WorkoutTemplate,
  TrainingExerciseDto,
  TrainingSetDto,
  TrainingSessionProgressDto,
  TrainingService,
  TrainingSessionDto,
  ExerciseHistoryDto,
} from 'data-access-training';

@Component({
  selector: 'lib-training-session',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './training-session.page.html',
  styleUrl: './training-session.page.scss',
})
export class TrainingSessionPage {
  private readonly trainingService = inject(TrainingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly deleting = signal(false);
  protected readonly sessionSubmitting = signal(false);
  protected readonly exerciseSubmitting = signal(false);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly sessionError = signal<string | null>(null);
  protected readonly sessionServerError = signal<string | null>(null);
  protected readonly exerciseServerError = signal<string | null>(null);
  protected readonly exerciseList = signal<TrainingExerciseDto[]>([]);
  protected readonly setsByExercise = signal<Record<string, TrainingSetDto[]>>({});
  protected readonly lastHistoryByName = signal<Record<string, ExerciseHistoryDto | null>>({});
  protected readonly progress = signal<TrainingSessionProgressDto>({
    totalSets: 0,
    completedSets: 0,
    completionPercent: 0,
  });

  protected readonly sessionForm = this.fb.nonNullable.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    templateType: ['custom' as string, Validators.required],
    note: [''],
  });

  protected readonly exerciseForm = this.fb.nonNullable.group({
    exerciseName: ['', Validators.required],
    muscleGroup: ['full-body' as MuscleGroup, Validators.required],
    note: [''],
  });

  protected readonly setForm = this.fb.nonNullable.group({
    reps: [10, Validators.required],
    weightKg: [20, Validators.required],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
      void this.loadSession(id);
    }
  }

  protected async onSessionSubmit(): Promise<void> {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }
    this.sessionSubmitting.set(true);
    this.sessionServerError.set(null);
    try {
      const id = this.sessionId();
      const raw = this.sessionForm.getRawValue();
      const payload = { ...raw, templateType: raw.templateType as WorkoutTemplate };
      const session = id
        ? await this.trainingService.updateSession(id, payload)
        : await this.trainingService.createSession(payload);
      if (!id) {
        this.sessionId.set(session.id);
        await this.router.navigate(['/session', session.id], { replaceUrl: true });
      }
    } catch (error) {
      this.sessionServerError.set(
        error instanceof Error ? error.message : 'Session konnte nicht gespeichert werden.',
      );
    } finally {
      this.sessionSubmitting.set(false);
    }
  }

  protected async onExerciseSubmit(): Promise<void> {
    if (this.exerciseForm.invalid) {
      this.exerciseForm.markAllAsTouched();
      return;
    }
    const sid = this.sessionId();
    if (!sid) {
      this.exerciseServerError.set('Session muss zuerst gespeichert werden.');
      return;
    }
    this.exerciseSubmitting.set(true);
    this.exerciseServerError.set(null);
    try {
      const { exerciseName, muscleGroup, note } = this.exerciseForm.getRawValue();
      await this.trainingService.createExercise(sid, {
        exerciseName,
        muscleGroup,
        note: note || null,
      });
      this.exerciseForm.reset({ exerciseName: '', muscleGroup: 'full-body', note: '' });
      await this.reloadExerciseData(sid);
    } catch (error) {
      this.exerciseServerError.set(
        error instanceof Error ? error.message : 'Uebung konnte nicht erstellt werden.',
      );
    } finally {
      this.exerciseSubmitting.set(false);
    }
  }

  protected async onDelete(): Promise<void> {
    const id = this.sessionId();
    if (!id) return;
    this.deleting.set(true);
    this.sessionError.set(null);
    try {
      await this.trainingService.deleteSession(id);
      await this.router.navigate(['/session']);
    } catch (error) {
      this.sessionError.set(
        error instanceof Error ? error.message : 'Session konnte nicht geloescht werden.',
      );
    } finally {
      this.deleting.set(false);
    }
  }

  protected async onDeleteExercise(exerciseId: string): Promise<void> {
    const sid = this.sessionId();
    if (!sid) return;
    await this.runAction(async () => {
      await this.trainingService.deleteExercise(sid, exerciseId);
      await this.reloadExerciseData(sid);
    });
  }

  protected async onAddSet(exerciseId: string): Promise<void> {
    const sid = this.sessionId();
    if (!sid) return;
    const { reps, weightKg } = this.setForm.getRawValue();
    await this.runAction(async () => {
      await this.trainingService.createSet(sid, exerciseId, { reps, weightKg, done: false });
      await this.reloadExerciseData(sid);
    });
  }

  protected async onToggleSetDone(exerciseId: string, set: TrainingSetDto): Promise<void> {
    const sid = this.sessionId();
    if (!sid) return;
    await this.runAction(async () => {
      await this.trainingService.updateSet(sid, exerciseId, set.id, { done: !set.done });
      await this.reloadExerciseData(sid);
    });
  }

  protected async onDeleteSet(exerciseId: string, setId: string): Promise<void> {
    const sid = this.sessionId();
    if (!sid) return;
    await this.runAction(async () => {
      await this.trainingService.deleteSet(sid, exerciseId, setId);
      await this.reloadExerciseData(sid);
    });
  }

  protected onApplyLastSet(exerciseName: string): void {
    const history = this.lastHistoryByName()[exerciseName];
    if (!history?.sets?.length) return;
    const last = history.sets[history.sets.length - 1];
    this.setForm.patchValue({ reps: last.reps, weightKg: last.weightKg });
  }

  private async loadSession(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const session = await this.trainingService.getSession(id);
      this.applySessionToForm(session);
      await this.reloadExerciseData(id);
    } catch {
      await this.router.navigate(['/session']);
    } finally {
      this.loading.set(false);
    }
  }

  private async reloadExerciseData(sessionId: string): Promise<void> {
    const exercises = await this.trainingService.listExercises(sessionId);
    this.exerciseList.set(exercises);

    const pairs = await Promise.all(
      exercises.map(async (exercise) => {
        const sets = await this.trainingService.listSets(sessionId, exercise.id);
        return [exercise.id, sets] as const;
      }),
    );
    this.setsByExercise.set(Object.fromEntries(pairs));
    this.progress.set(await this.trainingService.getProgress(sessionId));

    const uniqueNames = [...new Set(exercises.map((e) => e.exerciseName))];
    const historyEntries = await Promise.all(
      uniqueNames.map(async (name) => {
        try {
          const history = await this.trainingService.getExerciseHistory(name, sessionId);
          return [name, history] as const;
        } catch {
          return [name, null] as const;
        }
      }),
    );
    this.lastHistoryByName.set(Object.fromEntries(historyEntries));
  }

  private applySessionToForm(session: TrainingSessionDto): void {
    this.sessionForm.patchValue({
      date: session.date,
      templateType: session.templateType,
      note: session.note ?? '',
    });
  }

  private async runAction(action: () => Promise<void>): Promise<void> {
    this.sessionError.set(null);
    try {
      await action();
    } catch (error) {
      this.sessionError.set(error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    }
  }
}
