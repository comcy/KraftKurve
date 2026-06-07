import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  TrainingService, 
  TrainingSessionDto, 
  TrainingExerciseDto, 
  TrainingSetDto,
  TrainingRoutineDto,
  ExerciseSuggestionDto,
  MuscleGroup 
} from 'lib-training-data-access';

@Injectable({ providedIn: 'root' })
export class TrainingStateService {
  private readonly _trainingApi = inject(TrainingService);

  readonly activeSession = signal<TrainingSessionDto | null>(null);
  readonly exercises = signal<TrainingExerciseDto[]>([]);
  readonly setsByExercise = signal<Record<string, TrainingSetDto[]>>({});
  readonly suggestions = signal<Record<string, ExerciseSuggestionDto | null>>({});
  
  readonly sessionDurationSeconds = signal<number>(0);
  readonly isPaused = signal<boolean>(false);
  private _timerInterval: any;

  readonly durationFormatted = computed(() => {
    const totalSeconds = this.sessionDurationSeconds();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  async init() {
    const today = new Date().toISOString().split('T')[0];
    const sessions = await this._trainingApi.listSessions();
    const todaySession = sessions.find(s => s.date === today && s.finishedAt === null);
    
    if (todaySession) {
      await this.resumeSession(todaySession);
    }
  }

  async startSession(planId?: string, routineId?: string) {
    let session: TrainingSessionDto | null = null;
    try {
      session = await this._trainingApi.createSession({
        date: new Date().toISOString().split('T')[0],
        templateType: 'custom',
        planId,
        routineId,
        totalSeconds: 0,
        isPaused: false
      });
      
      this.activeSession.set(session);
      this.sessionDurationSeconds.set(0);
      this.isPaused.set(false);
      this.startTimer();

      const [tSettings, routineExercises] = await Promise.all([
        this._trainingApi.getTrainingSettings(),
        routineId ? this._trainingApi.listRoutineExercises(routineId) : Promise.resolve([])
      ]);
      
      const vtEnabled = tSettings.virtualTrainerEnabled;

      if (routineId) {
        for (const re of routineExercises) {
          try {
            const activeEx = await this._trainingApi.createExercise(session.id, {
              exerciseName: re.exerciseName,
              muscleGroup: re.muscleGroup,
            });
            
            if (re.supersetGroupId) {
              await this._trainingApi.updateExercise(session.id, activeEx.id, {
                supersetGroupId: re.supersetGroupId
              });
            }

            let reps = 10;
            let weight = 0;
            
            if (vtEnabled) {
              const suggestion = await this._trainingApi.getSuggestion(re.exerciseName, session.id);
              if (suggestion) {
                reps = suggestion.suggestedTarget.reps;
                weight = suggestion.suggestedTarget.weightKg;
              }
            }

            for (let i = 0; i < re.suggestedSets; i++) {
              await this._trainingApi.createSet(session.id, activeEx.id, {
                reps,
                weightKg: weight,
                done: false
              });
            }
          } catch (e) {
            console.error(`[Provisioning] Failed exercise ${re.exerciseName}:`, e);
          }
        }
      }
    } catch (err) {
      console.error('Critical failure starting session:', err);
      throw err;
    } finally {
      if (session) {
        await this.resumeSession(session);
      }
    }
    return session;
  }

  async resumeSession(session: TrainingSessionDto) {
    this.activeSession.set(session);
    this.sessionDurationSeconds.set(session.totalSeconds);
    this.isPaused.set(session.isPaused);
    
    const [exercises, tSettings] = await Promise.all([
      this._trainingApi.listExercises(session.id),
      this._trainingApi.getTrainingSettings()
    ]);
    const vtEnabled = tSettings.virtualTrainerEnabled;
    this.exercises.set(exercises);
    
    const setsMap: Record<string, TrainingSetDto[]> = {};
    for (const ex of exercises) {
      const sets = await this._trainingApi.listSets(session.id, ex.id);
      setsMap[ex.id] = sets;
      
      if (vtEnabled) {
        const suggestion = await this._trainingApi.getSuggestion(ex.exerciseName);
        this.suggestions.update(map => ({ ...map, [ex.id]: suggestion }));
      }
    }
    this.setsByExercise.set(setsMap);

    if (!session.isPaused) {
      this.startTimer();
    }
  }

  async pauseSession() {
    const session = this.activeSession();
    if (!session) return;

    this.stopTimer();
    this.isPaused.set(true);
    await this._trainingApi.updateSession(session.id, {
      isPaused: true,
      totalSeconds: this.sessionDurationSeconds()
    });
  }

  async resumeActiveSession() {
    const session = this.activeSession();
    if (!session) return;

    this.isPaused.set(false);
    this.startTimer();
    await this._trainingApi.updateSession(session.id, {
      isPaused: false
    });
  }

  async finishSession() {
    const session = this.activeSession();
    if (!session) return;

    this.stopTimer();

    const exercises = this.exercises();
    if (exercises.length === 0) {
      await this._trainingApi.deleteSession(session.id);
      this.activeSession.set(null);
      return;
    }

    await this._trainingApi.updateSession(session.id, {
      finishedAt: new Date().toISOString(),
      totalSeconds: this.sessionDurationSeconds(),
      isPaused: false
    });
    this.activeSession.set(null);
  }

  async getNextRoutine(planId: string): Promise<TrainingRoutineDto | null> {
    try {
      const [routines, sessions] = await Promise.all([
        this._trainingApi.listRoutines(planId),
        this._trainingApi.listSessions()
      ]);

      if (routines.length === 0) return null;

      const planSessions = sessions
        .filter(s => s.planId === planId && s.finishedAt !== null)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

      if (planSessions.length === 0) {
        return routines[0];
      }

      const lastRoutineId = planSessions[0].routineId;
      const lastIndex = routines.findIndex(r => r.id === lastRoutineId);

      if (lastIndex === -1 || lastIndex === routines.length - 1) {
        return routines[0];
      }

      return routines[lastIndex + 1];
    } catch {
      return null;
    }
  }

  async addExercise(name: string, muscleGroup: MuscleGroup) {
    const session = this.activeSession();
    if (!session) return;

    const [exercise, tSettings] = await Promise.all([
      this._trainingApi.createExercise(session.id, { exerciseName: name, muscleGroup }),
      this._trainingApi.getTrainingSettings()
    ]);
    
    this.exercises.update(list => [...list, exercise]);
    
    let defaultReps = 10;
    let defaultWeight = 0;

    if (tSettings.virtualTrainerEnabled) {
      const suggestion = await this._trainingApi.getSuggestion(name, session.id);
      this.suggestions.update(map => ({ ...map, [exercise.id]: suggestion }));
      if (suggestion) {
        defaultReps = suggestion.suggestedTarget.reps;
        defaultWeight = suggestion.suggestedTarget.weightKg;
      }
    }

    for (let i = 0; i < 3; i++) {
      await this.addSet(exercise.id, defaultReps, defaultWeight);
    }
  }

  async deleteExercise(exerciseId: string) {
    const session = this.activeSession();
    if (!session) return;

    await this._trainingApi.deleteExercise(session.id, exerciseId);
    
    this.exercises.update(list => list.filter(e => e.id !== exerciseId));
    this.setsByExercise.update(map => {
      const newMap = { ...map };
      delete newMap[exerciseId];
      return newMap;
    });
  }

  async addSet(exerciseId: string, reps: number, weight: number) {
    const session = this.activeSession();
    if (!session) return;

    const set = await this._trainingApi.createSet(session.id, exerciseId, {
      reps,
      weightKg: weight,
      done: false
    });
    this.setsByExercise.update(map => {
      const list = map[exerciseId] || [];
      return { ...map, [exerciseId]: [...list, set] };
    });
  }

  async updateSet(exerciseId: string, setId: string, reps: number, weight: number, rir?: number | null, done?: boolean) {
    const session = this.activeSession();
    if (!session) return;

    const currentSets = this.setsByExercise()[exerciseId] || [];
    const current = currentSets.find(s => s.id === setId);
    
    const updatedSet = await this._trainingApi.updateSet(session.id, exerciseId, setId, {
      reps,
      weightKg: weight,
      rir: rir !== undefined ? rir : (current?.rir ?? null),
      done: done !== undefined ? done : (current?.done ?? false)
    });

    this.setsByExercise.update(map => {
      const list = (map[exerciseId] || []).map(s => s.id === setId ? updatedSet : s);
      return { ...map, [exerciseId]: list };
    });
  }

  async reorderExercise(exerciseId: string, newOrder: number) {
    const session = this.activeSession();
    if (!session) return;

    await this._trainingApi.updateExercise(session.id, exerciseId, {
      order: newOrder
    });
    const list = await this._trainingApi.listExercises(session.id);
    this.exercises.set(list);
  }

  private startTimer() {
    this.stopTimer();
    this._timerInterval = setInterval(() => {
      this.sessionDurationSeconds.update(s => s + 1);
    }, 1000);
  }

  private stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
    }
  }
}
