import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MuscleGroup,
  WorkoutTemplate,
  TrainingExerciseDto,
  TrainingSetDto,
  TrainingSessionDto,
  TrainingSessionProgressDto,
  TrainingService,
  ExerciseDto,
  ExerciseHistoryDto,
} from 'lib-training-data-access';
import { map, startWith } from 'rxjs';

@Component({
  selector: 'lib-training-session',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './training-session.page.html',
  styleUrl: './training-session.page.scss',
})
export class TrainingSessionPage implements OnInit {
  private readonly trainingService = inject(TrainingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Labels
  protected readonly labelBack = 'Zurück';
  protected readonly labelPageTitle = 'Training Session';
  protected readonly labelProgressTitle = 'Fortschritt';
  protected readonly labelLoading = 'Lade Session...';
  protected readonly labelSave = 'Speichern';
  protected readonly labelSaving = 'Speichere...';
  protected readonly labelDeleteSession = 'Session löschen';
  protected readonly labelDeleting = 'Lösche...';
  protected readonly labelExercisesTitle = 'Übungen';
  protected readonly labelAddExercise = 'Übung hinzufügen';
  protected readonly labelAdding = 'Füge hinzu...';
  protected readonly labelNoExercises = 'Keine Übungen vorhanden.';
  protected readonly labelAddSet = 'Satz hinzufügen';
  protected readonly labelLastTime = 'Letztes Mal';
  protected readonly labelApply = 'Übernehmen';
  protected readonly labelDate = 'Datum';
  protected readonly labelTemplate = 'Template';
  protected readonly labelNote = 'Notiz';
  protected readonly labelExerciseName = 'Übungsname';
  protected readonly labelMuscleGroup = 'Muskelgruppe';
  protected readonly labelReps = 'Wdh.';
  protected readonly labelWeight = 'Gewicht (kg)';

  // Data
  protected readonly loading = signal(false);
  protected readonly deleting = signal(false);
  protected readonly sessionSubmitting = signal(false);
  protected readonly exerciseSubmitting = signal(false);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly sessionError = signal<string | null>(null);
  protected readonly sessionServerError = signal<string | null>(null);
  protected readonly exerciseServerError = signal<string | null>(null);
  protected readonly exerciseList = signal<TrainingExerciseDto[]>([]);
  protected readonly catalog = signal<ExerciseDto[]>([]);
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
    reps: [10, [Validators.required, Validators.min(1)]],
    weightKg: [20, [Validators.required, Validators.min(0)]],
  });

  protected readonly muscleGroups: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'abs', 'glutes', 'quads', 'hamstrings', 'calves', 'full-body', 'cardio'
  ];

  protected readonly templates: WorkoutTemplate[] = ['push', 'pull', 'legs', 'full-body', 'custom'];

  protected filteredExercises$ = this.exerciseForm.controls.exerciseName.valueChanges.pipe(
    startWith(''),
    map(value => this.filterCatalog(value || ''))
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
    }
  }

  ngOnInit(): void {
    const id = this.sessionId();
    if (id) {
      void this.loadSession(id);
    }
    void this.loadCatalog();
  }

  private filterCatalog(value: string): ExerciseDto[] {
    const filterValue = value.toLowerCase();
    return this.catalog().filter(option => option.name.toLowerCase().includes(filterValue));
  }

  protected onExerciseSelected(exercise: ExerciseDto): void {
    this.exerciseForm.patchValue({
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
    });
  }

  protected async loadCatalog(): Promise<void> {
    try {
      const list = await this.trainingService.listCatalog();
      this.catalog.set(list);
    } catch {
      // Ignore catalog load errors for now
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
      this.snackBar.open('Session gespeichert', 'OK', { duration: 2000 });
      if (!id) {
        this.sessionId.set(session.id);
        await this.router.navigate(['/training/session', session.id], { replaceUrl: true });
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
      this.snackBar.open('Übung hinzugefügt', 'OK', { duration: 2000 });
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
    if (!confirm('Session wirklich löschen?')) return;
    const id = this.sessionId();
    if (!id) return;
    this.deleting.set(true);
    this.sessionError.set(null);
    try {
      await this.trainingService.deleteSession(id);
      this.snackBar.open('Session gelöscht', 'OK', { duration: 2000 });
      await this.router.navigate(['/training']);
    } catch (error) {
      this.sessionError.set(
        error instanceof Error ? error.message : 'Session konnte nicht geloescht werden.',
      );
    } finally {
      this.deleting.set(false);
    }
  }

  protected async onDeleteExercise(exerciseId: string): Promise<void> {
    if (!confirm('Übung wirklich entfernen?')) return;
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
      await this.router.navigate(['/training']);
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
