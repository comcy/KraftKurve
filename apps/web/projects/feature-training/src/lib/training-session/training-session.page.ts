import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import {
  MuscleGroup,
  TrainingExerciseDto,
  TrainingSetDto,
  TrainingSessionProgressDto,
  TrainingService,
  TrainingSessionDto,
  WorkoutTemplate,
  ExerciseHistoryDto,
} from 'data-access-training';

interface SessionFormModel {
  date: string;
  templateType: WorkoutTemplate;
  note: string;
}

interface ExerciseFormModel {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  note: string;
}

interface SetFormModel {
  reps: number;
  weightKg: number;
}

@Component({
  selector: 'lib-training-session',
  imports: [FormRoot, FormField, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="padding:2rem;max-width:46rem;display:grid;gap:1.2rem">
      <a routerLink="/session">← Zurück</a>
      <h2>Training Session</h2>

      @if (loading()) {
        <p>Lade Session...</p>
      }

      @if (actionError()) {
        <p style="margin:0;color:#b42318">{{ actionError() }}</p>
      }

      @if (sessionId()) {
        <section style="padding:0.9rem;border:1px solid #d8d8d8;border-radius:0.75rem">
          <h3 style="margin-top:0">Fortschritt aktuelles Training</h3>
          <p style="margin:0 0 0.6rem">
            {{ progress().completedSets }} / {{ progress().totalSets }} Saetze erledigt
            ({{ progress().completionPercent }}%)
          </p>
          <div style="height:10px;background:#ececec;border-radius:999px;overflow:hidden">
            <div
              style="height:100%;background:linear-gradient(90deg,#1f1d17,#8a5a00)"
              [style.width.%]="progress().completionPercent"
            ></div>
          </div>
        </section>
      }

      <form [formRoot]="sessionForm" style="display:grid;gap:0.9rem">
        @if (sessionForm().errors().length) {
          <div style="padding:0.75rem;border:1px solid #f7c5bf;background:#fff1ef;border-radius:0.75rem">
            @for (error of sessionForm().errors(); track trackError($index, error.kind, error.message ?? '')) {
              <p style="margin:0;color:#b42318">{{ error.message }}</p>
            }
          </div>
        }

        <label>
          Datum
          <input type="date" [formField]="sessionForm.date" />
        </label>

        <label>
          Template
          <select [formField]="sessionForm.templateType">
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="legs">Legs</option>
            <option value="full-body">Full Body</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label>
          Notiz
          <textarea rows="4" [formField]="sessionForm.note"></textarea>
        </label>

        <button type="submit" [disabled]="sessionForm().submitting()">
          @if (sessionForm().submitting()) {
            Speichere...
          } @else {
            Speichern
          }
        </button>

        @if (sessionId()) {
          <button type="button" (click)="onDelete()" [disabled]="deleting()">
            @if (deleting()) {
              Lösche...
            } @else {
              Session löschen
            }
          </button>
        }
      </form>

      @if (sessionId()) {
        <section style="display:grid;gap:0.9rem">
          <h3>Uebungen</h3>

          <form [formRoot]="exerciseForm" style="display:grid;gap:0.75rem;padding:0.9rem;border:1px solid #d8d8d8;border-radius:0.75rem">
            <label>
              Uebungsname
              <input type="text" [formField]="exerciseForm.exerciseName" />
            </label>

            <label>
              Muskelgruppe
              <select [formField]="exerciseForm.muscleGroup">
                <option value="chest">Chest</option>
                <option value="back">Back</option>
                <option value="shoulders">Shoulders</option>
                <option value="biceps">Biceps</option>
                <option value="triceps">Triceps</option>
                <option value="forearms">Forearms</option>
                <option value="abs">Abs</option>
                <option value="glutes">Glutes</option>
                <option value="quads">Quads</option>
                <option value="hamstrings">Hamstrings</option>
                <option value="calves">Calves</option>
                <option value="full-body">Full Body</option>
                <option value="cardio">Cardio</option>
              </select>
            </label>

            <label>
              Notiz
              <input type="text" [formField]="exerciseForm.note" />
            </label>

            <button type="submit" [disabled]="exerciseForm().submitting()">
              @if (exerciseForm().submitting()) {
                Fuege hinzu...
              } @else {
                Uebung hinzufuegen
              }
            </button>
          </form>

          @if (!exerciseList().length) {
            <p>Keine Uebungen vorhanden.</p>
          } @else {
            <div style="display:grid;gap:0.7rem">
              @for (exercise of exerciseList(); track exercise.id) {
                <article style="padding:0.9rem;border:1px solid #d8d8d8;border-radius:0.75rem;display:grid;gap:0.6rem">
                  <div style="display:flex;justify-content:space-between;gap:0.8rem;align-items:center">
                    <div>
                      <strong>{{ exercise.exerciseName }}</strong>
                      <div style="font-size:0.85rem;color:#666">{{ exercise.muscleGroup }}</div>
                    </div>
                    <button type="button" (click)="onDeleteExercise(exercise.id)">Loeschen</button>
                  </div>

                  @if (lastHistoryByName()[exercise.exerciseName]) {
                    <div style="padding:0.5rem 0.7rem;background:#f0f9ff;border:1px solid #bae6fd;border-radius:0.5rem;font-size:0.85rem">
                      <span style="color:#0369a1;font-weight:600">Letztes Mal ({{ lastHistoryByName()[exercise.exerciseName]!.sessionDate }}):</span>
                      <span style="margin-left:0.4rem">
                        @for (s of lastHistoryByName()[exercise.exerciseName]!.sets; track s.order) {
                          {{ s.reps }} × {{ s.weightKg }}kg{{ !$last ? ' · ' : '' }}
                        }
                      </span>
                      <button
                        type="button"
                        style="margin-left:0.6rem;padding:0.15rem 0.5rem;border:1px solid #0369a1;border-radius:4px;background:#e0f2fe;color:#0369a1;font-size:0.8rem;cursor:pointer"
                        (click)="onApplyLastSet(exercise.exerciseName)"
                      >Übernehmen</button>
                    </div>
                  }

                  <form
                    [formRoot]="setForm"
                    style="display:grid;grid-template-columns:1fr 1fr auto;gap:0.5rem"
                  >
                    <label>
                      Reps
                      <input type="number" [formField]="setForm.reps" />
                    </label>
                    <label>
                      Gewicht (kg)
                      <input type="number" [formField]="setForm.weightKg" />
                    </label>
                    <button type="button" (click)="onAddSet(exercise.id)">+ Satz</button>
                  </form>

                  @if (!setsByExercise()[exercise.id]?.length) {
                    <p style="margin:0;color:#666">Noch keine Saetze.</p>
                  } @else {
                    <ul style="margin:0;padding-left:1.2rem;display:grid;gap:0.35rem">
                      @for (set of setsByExercise()[exercise.id]; track set.id) {
                        <li style="display:flex;justify-content:space-between;gap:0.7rem;align-items:center">
                          <span>
                            Satz {{ set.order }}: {{ set.reps }} reps @ {{ set.weightKg }}kg
                          </span>
                          <span style="display:flex;gap:0.45rem;align-items:center">
                            <label style="display:flex;gap:0.25rem;align-items:center">
                              <input
                                type="checkbox"
                                [checked]="set.done"
                                (change)="onToggleSetDone(exercise.id, set)"
                              />
                              done
                            </label>
                            <button type="button" (click)="onDeleteSet(exercise.id, set.id)">x</button>
                          </span>
                        </li>
                      }
                    </ul>
                  }
                </article>
              }
            </div>
          }
        </section>
      }
    </main>
  `,
})
export class TrainingSessionPage {
  private readonly trainingService = inject(TrainingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly deleting = signal(false);
  protected readonly sessionId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly exerciseList = signal<TrainingExerciseDto[]>([]);
  protected readonly setsByExercise = signal<Record<string, TrainingSetDto[]>>({});
  protected readonly lastHistoryByName = signal<Record<string, ExerciseHistoryDto | null>>({});
  protected readonly progress = signal<TrainingSessionProgressDto>({
    totalSets: 0,
    completedSets: 0,
    completionPercent: 0,
  });
  protected readonly model = signal<SessionFormModel>({
    date: new Date().toISOString().slice(0, 10),
    templateType: 'custom',
    note: '',
  });

  protected readonly exerciseModel = signal<ExerciseFormModel>({
    exerciseName: '',
    muscleGroup: 'full-body',
    note: '',
  });

  protected readonly setModel = signal<SetFormModel>({
    reps: 10,
    weightKg: 20,
  });

  protected readonly sessionForm = form(
    this.model,
    (session) => {
      required(session.date, { message: 'Datum ist erforderlich.' });
      required(session.templateType, { message: 'Template ist erforderlich.' });
    },
    {
      submission: {
        action: async (field) => {
          try {
            const id = this.sessionId();
            const payload = {
              date: field.date().value(),
              templateType: field.templateType().value(),
              note: field.note().value() || null,
            };
            const session = id
              ? await this.trainingService.updateSession(id, payload)
              : await this.trainingService.createSession(payload);

            if (!id) {
              this.sessionId.set(session.id);
              await this.router.navigate(['/session', session.id], { replaceUrl: true });
            }
            return;
          } catch (error) {
            return {
              kind: 'serverError',
              message:
                error instanceof Error
                  ? error.message
                  : 'Session konnte nicht gespeichert werden.',
            };
          }
        },
      },
    },
  );

  protected readonly exerciseForm = form(
    this.exerciseModel,
    (exercise) => {
      required(exercise.exerciseName, { message: 'Uebungsname ist erforderlich.' });
      required(exercise.muscleGroup, { message: 'Muskelgruppe ist erforderlich.' });
    },
    {
      submission: {
        action: async (field) => {
          const sid = this.sessionId();
          if (!sid) {
            return { kind: 'serverError', message: 'Session muss zuerst gespeichert werden.' };
          }
          try {
            await this.trainingService.createExercise(sid, {
              exerciseName: field.exerciseName().value(),
              muscleGroup: field.muscleGroup().value(),
              note: field.note().value() || null,
            });
            this.exerciseModel.set({ exerciseName: '', muscleGroup: 'full-body', note: '' });
            await this.reloadExerciseData(sid);
            return;
          } catch (error) {
            return {
              kind: 'serverError',
              message: error instanceof Error ? error.message : 'Uebung konnte nicht erstellt werden.',
            };
          }
        },
      },
    },
  );

  protected readonly setForm = form(
    this.setModel,
    (set) => {
      required(set.reps, { message: 'Reps sind erforderlich.' });
      required(set.weightKg, { message: 'Gewicht ist erforderlich.' });
    },
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.sessionId.set(id);
      void this.loadSession(id);
    }
  }

  protected trackError(index: number, kind: string, message: string): string {
    return `${index}-${kind}-${message}`;
  }

  protected async onDelete(): Promise<void> {
    const id = this.sessionId();
    if (!id) return;
    this.deleting.set(true);
    this.actionError.set(null);
    try {
      await this.trainingService.deleteSession(id);
      await this.router.navigate(['/session']);
    } catch (error) {
      this.actionError.set(
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
    const values = this.setForm().value();
    await this.runAction(async () => {
      await this.trainingService.createSet(sid, exerciseId, {
        reps: values.reps,
        weightKg: values.weightKg,
        done: false,
      });
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

  private async loadSession(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const session = await this.trainingService.getSession(id);
      this.applySessionToModel(session);
      await this.reloadExerciseData(id);
    } catch {
      await this.router.navigate(['/session']);
    } finally {
      this.loading.set(false);
    }
  }

  protected onApplyLastSet(exerciseName: string): void {
    const history = this.lastHistoryByName()[exerciseName];
    if (!history?.sets?.length) return;
    // Use last set in history as template for next set
    const last = history.sets[history.sets.length - 1];
    this.setModel.set({ reps: last.reps, weightKg: last.weightKg });
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

    // Fetch "Letztes Mal" history for each unique exercise name
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

  private applySessionToModel(session: TrainingSessionDto): void {
    this.model.set({
      date: session.date,
      templateType: session.templateType,
      note: session.note ?? '',
    });
  }

  private async runAction(action: () => Promise<void>): Promise<void> {
    this.actionError.set(null);
    try {
      await action();
    } catch (error) {
      this.actionError.set(error instanceof Error ? error.message : 'Aktion fehlgeschlagen.');
    }
  }
}
