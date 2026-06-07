import { v4 as uuidv4 } from 'uuid';
import { TrainingSession, WorkoutTemplate } from '../../domain/training-session.entity';
import { ITrainingSessionRepository } from '../../infrastructure/repositories/training-session.repository.interface';
import { ITrainingExerciseRepository } from '../../infrastructure/repositories/training-exercise.repository.interface';
import { ITrainingSetRepository } from '../../infrastructure/repositories/training-set.repository.interface';
import { MuscleGroup, TrainingExercise } from '../../domain/training-exercise.entity';
import { TrainingSet } from '../../domain/training-set.entity';
import { TrainingPlan } from '../../domain/training-plan.entity';
import { TrainingRoutine, TrainingRoutineExercise } from '../../domain/training-routine.entity';
import { CardioRecord } from '../../domain/cardio-record.entity';
import { TrainingSettings, OverloadStrategy } from '../../domain/training-settings.entity';
import { ITrainingPlanRepository } from '../../infrastructure/repositories/training-plan.repository.interface';
import { ITrainingRoutineRepository, ITrainingRoutineExerciseRepository } from '../../infrastructure/repositories/training-routine.repository.interface';
import { ICardioRecordRepository } from '../../infrastructure/repositories/cardio-record.repository.interface';
import { ITrainingSettingsRepository } from '../../infrastructure/repositories/training-settings.repository.interface';
import { IExerciseRepository } from '../../infrastructure/repositories/exercise.repository.interface';
import { Exercise } from '../../domain/exercise.entity';

export interface CreateTrainingSessionInput {
  date: string;
  templateType: WorkoutTemplate;
  planId?: string | null;
  routineId?: string | null;
  note?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
  totalSeconds?: number;
  isPaused?: boolean;
}

export interface UpdateTrainingSessionInput {
  date?: string;
  templateType?: WorkoutTemplate;
  planId?: string | null;
  routineId?: string | null;
  note?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
  totalSeconds?: number;
  isPaused?: boolean;
}

export interface CreateTrainingExerciseInput {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  note?: string | null;
}

export interface UpdateTrainingExerciseInput {
  exerciseName?: string;
  muscleGroup?: MuscleGroup;
  note?: string | null;
  order?: number;
  supersetGroupId?: string | null;
}

export interface CreateTrainingSetInput {
  reps: number;
  weightKg: number;
  done?: boolean;
}

export interface UpdateTrainingSetInput {
  reps?: number;
  weightKg?: number;
  done?: boolean;
  order?: number;
}

export interface CreateCardioRecordInput {
  durationSeconds: number;
  distanceMeters?: number | null;
  caloriesBurned?: number | null;
  heartRateAverage?: number | null;
  note?: string | null;
}

export interface TrainingSessionProgress {
  totalSets: number;
  completedSets: number;
  completionPercent: number;
}

export interface CreateTrainingPlanInput {
  name: string;
  startDate: string;
  endDate: string;
  sessionsPerWeek: number;
  note?: string | null;
  active?: boolean;
}

export interface UpdateTrainingPlanInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  sessionsPerWeek?: number;
  note?: string | null;
  active?: boolean;
}

export interface ExerciseSuggestion {
  exerciseName: string;
  strategy: OverloadStrategy;
  lastPerformance: {
    sets: number;
    weightKg: number;
    reps: number;
    date: string;
  } | null;
  suggestedTarget: {
    sets: number;
    weightKg: number;
    reps: number;
  };
  reason: string;
}

export interface CreateExerciseInput {
  name: string;
  category: any;
  muscleGroup: MuscleGroup;
  equipmentType?: any;
}

export interface UpdateExerciseInput {
  name?: string;
  category?: any;
  muscleGroup?: MuscleGroup;
  equipmentType?: any;
}

export interface BodyHeatmapEntry {
  totalSets: number;
  completedSets: number;
  sessionCount: number;
}

export interface BodyHeatmapInsight {
  days: number;
  totalSets: number;
  totalCompletedSets: number;
  muscles: Record<MuscleGroup, BodyHeatmapEntry>;
}

export interface StagnationSuggestion {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  suggestionType: 'increase' | 'deload';
  currentBestWeightKg: number;
  suggestedWeightKg: number;
  stagnationSessions: number;
  observedCompletionRatio: number;
  reason: string;
}

export interface StagnationRules {
  window: number;
  incrementKg: number;
  minCompletedSets: number;
  minCompletionRatio?: number;
  deloadDropPercent?: number;
}

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'full-body',
  'cardio',
];

function now(): string {
  return new Date().toISOString();
}

function baseEntity(id = uuidv4()) {
  const ts = now();
  return {
    id,
    createdAt: ts,
    updatedAt: ts,
    version: 1,
  };
}

export class TrainingService {
  constructor(
    private readonly sessions: ITrainingSessionRepository,
    private readonly exercises: ITrainingExerciseRepository,
    private readonly sets: ITrainingSetRepository,
    private readonly plans: ITrainingPlanRepository,
    private readonly routines: ITrainingRoutineRepository,
    private readonly routineExercises: ITrainingRoutineExerciseRepository,
    private readonly cardio: ICardioRecordRepository,
    private readonly settings: ITrainingSettingsRepository,
    private readonly catalog: IExerciseRepository,
  ) {}

  private async enrichSession(session: TrainingSession): Promise<any> {
    const exercises = await this.exercises.findBySession(session.id);
    let planName: string | undefined;
    let routineName: string | undefined;

    if (session.planId) {
      const plan = await this.plans.findById(session.planId);
      planName = plan ? plan.name : undefined;
    }

    if (session.routineId) {
      const routines = await this.routines.findByPlanId(session.planId!);
      const routine = routines.find((r) => r.id === session.routineId);
      routineName = routine ? routine.name : undefined;
    }

    return {
      ...session,
      exerciseCount: exercises.length,
      planName,
      routineName,
    };
  }

  async listUserSessions(userId: string): Promise<any[]> {
    const list = await this.sessions.findByUser(userId);
    const enriched = await Promise.all(list.map((s) => this.enrichSession(s)));
    return enriched.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async getSession(userId: string, sessionId: string): Promise<any | null> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }
    return this.enrichSession(session);
  }

  async createSession(
    userId: string,
    input: CreateTrainingSessionInput,
  ): Promise<any> {
    const session: TrainingSession = {
      ...baseEntity(),
      userId,
      planId: input.planId ?? null,
      routineId: input.routineId ?? null,
      date: input.date,
      templateType: input.templateType,
      note: input.note ?? null,
      startedAt: input.startedAt ?? now(),
      finishedAt: input.finishedAt ?? null,
      totalSeconds: input.totalSeconds ?? 0,
      isPaused: input.isPaused ?? false,
    };
    const saved = await this.sessions.save(session);
    return this.enrichSession(saved);
  }

  async updateSession(
    userId: string,
    sessionId: string,
    input: UpdateTrainingSessionInput,
  ): Promise<any | null> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }

    const updated: TrainingSession = {
      ...session,
      planId: input.planId !== undefined ? input.planId : session.planId,
      routineId: input.routineId !== undefined ? input.routineId : session.routineId,
      date: input.date ?? session.date,
      templateType: input.templateType ?? session.templateType,
      note: input.note === undefined ? session.note : input.note,
      startedAt: input.startedAt ?? session.startedAt,
      finishedAt: input.finishedAt === undefined ? session.finishedAt : input.finishedAt,
      totalSeconds: input.totalSeconds !== undefined ? input.totalSeconds : session.totalSeconds,
      isPaused: input.isPaused !== undefined ? input.isPaused : session.isPaused,
      updatedAt: now(),
      version: session.version + 1,
    };

    const saved = await this.sessions.save(updated);
    return this.enrichSession(saved);
  }

  async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return false;
    }

    const sessionExercises = await this.exercises.findBySession(sessionId);
    for (const exercise of sessionExercises) {
      await this.sets.deleteByExercise(exercise.id);
    }
    await this.exercises.deleteBySession(sessionId);
    await this.sessions.deleteById(sessionId);
    return true;
  }

  async listSessionExercises(userId: string, sessionId: string): Promise<TrainingExercise[] | null> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const list = await this.exercises.findBySession(sessionId);
    return list.sort((a, b) => a.order - b.order);
  }

  async createExercise(
    userId: string,
    sessionId: string,
    input: CreateTrainingExerciseInput,
  ): Promise<TrainingExercise | null> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const existing = await this.exercises.findBySession(sessionId);
    const exercise: TrainingExercise = {
      ...baseEntity(),
      sessionId,
      exerciseName: input.exerciseName,
      muscleGroup: input.muscleGroup,
      order: existing.length + 1,
      supersetGroupId: null,
      note: input.note ?? null,
    };

    return this.exercises.save(exercise);
  }

  async updateExercise(
    userId: string,
    sessionId: string,
    exerciseId: string,
    input: UpdateTrainingExerciseInput,
  ): Promise<TrainingExercise | null> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const exercise = await this.exercises.findById(exerciseId);
    if (!exercise || exercise.sessionId !== sessionId) {
      return null;
    }

    const updated: TrainingExercise = {
      ...exercise,
      exerciseName: input.exerciseName ?? exercise.exerciseName,
      muscleGroup: input.muscleGroup ?? exercise.muscleGroup,
      note: input.note === undefined ? exercise.note : input.note,
      order: input.order ?? exercise.order,
      supersetGroupId: input.supersetGroupId === undefined ? exercise.supersetGroupId : input.supersetGroupId,
      updatedAt: now(),
      version: exercise.version + 1,
    };

    return this.exercises.save(updated);
  }

  async deleteExercise(
    userId: string,
    sessionId: string,
    exerciseId: string,
  ): Promise<boolean> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return false;
    }

    const exercise = await this.exercises.findById(exerciseId);
    if (!exercise || exercise.sessionId !== sessionId) {
      return false;
    }

    await this.sets.deleteByExercise(exerciseId);
    await this.exercises.deleteById(exerciseId);
    return true;
  }

  async listExerciseSets(
    userId: string,
    sessionId: string,
    exerciseId: string,
  ): Promise<TrainingSet[] | null> {
    const exercise = await this.getExerciseForUser(userId, sessionId, exerciseId);
    if (!exercise) {
      return null;
    }

    const list = await this.sets.findByExercise(exerciseId);
    return list.sort((a, b) => a.order - b.order);
  }

  async createSet(
    userId: string,
    sessionId: string,
    exerciseId: string,
    input: CreateTrainingSetInput,
  ): Promise<TrainingSet | null> {
    const exercise = await this.getExerciseForUser(userId, sessionId, exerciseId);
    if (!exercise) {
      return null;
    }

    const existing = await this.sets.findByExercise(exerciseId);
    const set: TrainingSet = {
      ...baseEntity(),
      trainingExerciseId: exerciseId,
      order: existing.length + 1,
      reps: input.reps,
      weightKg: input.weightKg,
      rir: (input as any).rir ?? null,
      done: input.done ?? false,
    };

    return this.sets.save(set);
  }

  async updateSet(
    userId: string,
    sessionId: string,
    exerciseId: string,
    setId: string,
    input: UpdateTrainingSetInput,
  ): Promise<TrainingSet | null> {
    const exercise = await this.getExerciseForUser(userId, sessionId, exerciseId);
    if (!exercise) {
      return null;
    }

    const set = await this.sets.findById(setId);
    if (!set || set.trainingExerciseId !== exerciseId) {
      return null;
    }

    const updated: TrainingSet = {
      ...set,
      reps: input.reps ?? set.reps,
      weightKg: input.weightKg ?? set.weightKg,
      rir: (input as any).rir !== undefined ? (input as any).rir : set.rir,
      done: input.done ?? set.done,
      order: input.order ?? set.order,
      updatedAt: now(),
      version: set.version + 1,
    };

    return this.sets.save(updated);
  }

  async deleteSet(
    userId: string,
    sessionId: string,
    exerciseId: string,
    setId: string,
  ): Promise<boolean> {
    const exercise = await this.getExerciseForUser(userId, sessionId, exerciseId);
    if (!exercise) {
      return false;
    }

    const set = await this.sets.findById(setId);
    if (!set || set.trainingExerciseId !== exerciseId) {
      return false;
    }

    await this.sets.deleteById(setId);
    return true;
  }

  // ── Cardio Records ───────────────────────────────────────────────────────

  async getCardioRecord(trainingExerciseId: string): Promise<CardioRecord | null> {
    return this.cardio.findByTrainingExerciseId(trainingExerciseId);
  }

  async createCardioRecord(
    userId: string,
    sessionId: string,
    exerciseId: string,
    input: CreateCardioRecordInput,
  ): Promise<CardioRecord | null> {
    const exercise = await this.getExerciseForUser(userId, sessionId, exerciseId);
    if (!exercise) return null;

    const record: CardioRecord = {
      ...baseEntity(),
      trainingExerciseId: exerciseId,
      durationSeconds: input.durationSeconds,
      distanceMeters: input.distanceMeters ?? null,
      caloriesBurned: input.caloriesBurned ?? null,
      heartRateAverage: input.heartRateAverage ?? null,
      note: input.note ?? null,
    };
    return this.cardio.save(record);
  }

  async updateCardioRecord(
    userId: string,
    sessionId: string,
    exerciseId: string,
    input: Partial<CreateCardioRecordInput>,
  ): Promise<CardioRecord | null> {
    const exercise = await this.getExerciseForUser(userId, sessionId, exerciseId);
    if (!exercise) return null;

    const existing = await this.cardio.findByTrainingExerciseId(exerciseId);
    if (!existing) return null;

    const updated: CardioRecord = {
      ...existing,
      durationSeconds: input.durationSeconds ?? existing.durationSeconds,
      distanceMeters: input.distanceMeters !== undefined ? input.distanceMeters : existing.distanceMeters,
      caloriesBurned: input.caloriesBurned !== undefined ? input.caloriesBurned : existing.caloriesBurned,
      heartRateAverage: input.heartRateAverage !== undefined ? input.heartRateAverage : existing.heartRateAverage,
      note: input.note !== undefined ? input.note : existing.note,
      updatedAt: now(),
      version: existing.version + 1,
    };
    return this.cardio.save(updated);
  }

  // ── Training Plans & Routines ─────────────────────────────────────────────

  async listUserPlans(userId: string): Promise<TrainingPlan[]> {
    const list = await this.plans.findByUserId(userId);
    return list.sort((a, b) => b.endDate.localeCompare(a.endDate));
  }

  async createPlan(userId: string, input: CreateTrainingPlanInput): Promise<TrainingPlan> {
    const plan: TrainingPlan = {
      ...baseEntity(),
      userId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      sessionsPerWeek: input.sessionsPerWeek,
      note: input.note ?? null,
      active: input.active ?? true,
    };
    return this.plans.save(plan);
  }

  async updatePlan(
    userId: string,
    planId: string,
    input: UpdateTrainingPlanInput,
  ): Promise<TrainingPlan | null> {
    const plan = await this.plans.findById(planId);
    if (!plan || plan.userId !== userId) {
      return null;
    }

    const updated: TrainingPlan = {
      ...plan,
      name: input.name ?? plan.name,
      startDate: input.startDate ?? plan.startDate,
      endDate: input.endDate ?? plan.endDate,
      sessionsPerWeek: input.sessionsPerWeek ?? plan.sessionsPerWeek,
      note: input.note === undefined ? plan.note : input.note,
      active: input.active ?? plan.active,
      updatedAt: now(),
      version: plan.version + 1,
    };

    return this.plans.save(updated);
  }

  async deletePlan(userId: string, planId: string): Promise<boolean> {
    const plan = await this.plans.findById(planId);
    if (!plan || plan.userId !== userId) {
      return false;
    }
    await this.plans.deleteById(planId);
    return true;
  }

  async listPlanRoutines(planId: string): Promise<(TrainingRoutine & { exerciseCount: number })[]> {
    const list = await this.routines.findByPlanId(planId);
    const enriched = await Promise.all(
      list.map(async (r) => {
        const exercises = await this.routineExercises.findByRoutineId(r.id);
        return { ...r, exerciseCount: exercises.length };
      }),
    );
    return enriched.sort((a, b) => a.order - b.order);
  }

  async createRoutine(planId: string, name: string): Promise<TrainingRoutine> {
    const existing = await this.routines.findByPlanId(planId);
    const routine: TrainingRoutine = {
      ...baseEntity(),
      planId,
      name,
      order: existing.length + 1,
    };
    return this.routines.save(routine);
  }

  async updateRoutine(routineId: string, name: string, order?: number): Promise<TrainingRoutine | null> {
    const routine = await this.routines.findById(routineId);
    if (!routine) return null;
    const updated: TrainingRoutine = {
      ...routine,
      name: name ?? routine.name,
      order: order ?? routine.order,
      updatedAt: now(),
      version: routine.version + 1,
    };
    return this.routines.save(updated);
  }

  async getRoutine(routineId: string): Promise<(TrainingRoutine & { exerciseCount: number }) | null> {
    const routine = await this.routines.findById(routineId);
    if (!routine) return null;
    const exercises = await this.routineExercises.findByRoutineId(routineId);
    return { ...routine, exerciseCount: exercises.length };
  }

  async deleteRoutine(routineId: string): Promise<void> {
    await this.routineExercises.deleteByRoutine(routineId);
    await this.routines.deleteById(routineId);
  }

  async getRoutineExercises(routineId: string): Promise<TrainingRoutineExercise[]> {
    const list = await this.routineExercises.findByRoutineId(routineId);
    return list.sort((a, b) => a.order - b.order);
  }

  async addRoutineExercise(
    routineId: string,
    input: { exerciseId?: string; exerciseName: string; muscleGroup: MuscleGroup; suggestedSets: number },
  ): Promise<TrainingRoutineExercise> {
    let finalExerciseId = input.exerciseId;

    // Optimization: Ensure exercise exists in global catalog
    const catalog = await this.listCatalog();
    const existing = catalog.find(e => e.name.toLowerCase() === input.exerciseName.toLowerCase());

    if (existing) {
      finalExerciseId = existing.id;
    } else {
      // Create new entry in global optimization catalog
      const newCatalogEx = await this.createCatalogExercise({
        name: input.exerciseName,
        muscleGroup: input.muscleGroup,
        category: 'strength',
      });
      finalExerciseId = newCatalogEx.id;
    }

    const existingInRoutine = await this.routineExercises.findByRoutineId(routineId);
    const ex: TrainingRoutineExercise = {
      ...baseEntity(),
      routineId,
      exerciseId: finalExerciseId!,
      exerciseName: input.exerciseName,
      muscleGroup: input.muscleGroup,
      suggestedSets: input.suggestedSets,
      order: existingInRoutine.length + 1,
      supersetGroupId: null,
    };
    return this.routineExercises.save(ex);
  }

  async updateRoutineExercise(
    exerciseId: string,
    input: { suggestedSets?: number; order?: number; supersetGroupId?: string | null },
  ): Promise<TrainingRoutineExercise | null> {
    const ex = await this.routineExercises.findById(exerciseId);
    if (!ex) return null;
    const updated: TrainingRoutineExercise = {
      ...ex,
      suggestedSets: input.suggestedSets ?? ex.suggestedSets,
      order: input.order ?? ex.order,
      supersetGroupId: input.supersetGroupId !== undefined ? input.supersetGroupId : ex.supersetGroupId,
      updatedAt: now(),
      version: ex.version + 1,
    };
    return this.routineExercises.save(updated);
  }

  async deleteRoutineExercise(exerciseId: string): Promise<void> {
    await this.routineExercises.deleteById(exerciseId);
  }

  // ── Virtual Trainer (Suggestions) ────────────────────────────────────────

  async getTrainingSettings(userId: string): Promise<TrainingSettings> {
    const existing = await this.settings.findByUserId(userId);
    if (existing) return existing;

    const defaults: TrainingSettings = {
      ...baseEntity(),
      userId,
      overloadStrategy: 'weight-focused',
      virtualTrainerEnabled: false,
    };
    return this.settings.save(defaults);
  }

  async updateTrainingSettings(
    userId: string,
    input: { strategy?: OverloadStrategy; virtualTrainerEnabled?: boolean },
  ): Promise<TrainingSettings> {
    const existing = await this.getTrainingSettings(userId);
    const updated: TrainingSettings = {
      ...existing,
      overloadStrategy: input.strategy ?? existing.overloadStrategy,
      virtualTrainerEnabled: input.virtualTrainerEnabled ?? existing.virtualTrainerEnabled,
      updatedAt: now(),
      version: existing.version + 1,
    };
    return this.settings.save(updated);
  }

  async getExerciseSuggestion(
    userId: string, 
    exerciseName: string, 
    excludeSessionId?: string
  ): Promise<ExerciseSuggestion | null> {
    const settings = await this.getTrainingSettings(userId);
    const lastPerf = await this.getLastExerciseSets(userId, exerciseName, excludeSessionId);

    if (!lastPerf || lastPerf.sets.length === 0) {
      const defaultWeight = settings.overloadStrategy === 'weight-focused' ? 20 : 15;
      const defaultReps = settings.overloadStrategy === 'rep-focused' ? 12 : 10;
      
      return {
        exerciseName,
        strategy: settings.overloadStrategy,
        lastPerformance: null,
        suggestedTarget: { sets: 3, weightKg: defaultWeight, reps: defaultReps },
        reason: 'Keine historischen Daten gefunden. Starte mit Standard-Protokoll.',
      };
    }

    const lastSets = lastPerf.sets;
    const avgWeight = lastSets.reduce((s, e) => s + e.weightKg, 0) / lastSets.length;
    const avgReps = lastSets.reduce((s, e) => s + e.reps, 0) / lastSets.length;
    
    // Set-by-Set RIR Analysis (Fatigue Curve)
    const minRir = Math.min(...lastSets.map(s => s.rir ?? 0));
    const maxRir = Math.max(...lastSets.map(s => s.rir ?? 0));
    const lastSetRir = lastSets[lastSets.length - 1].rir ?? 0;
    
    let suggestedWeight = avgWeight;
    let suggestedReps = Math.round(avgReps);
    let reason = '';

    // Logic according to ADR-009
    if (settings.overloadStrategy === 'weight-focused') {
      if (minRir >= 2) {
        // High RIR across all sets -> Progressive Overload
        const step = maxRir > 3 ? 2.5 : 1.25;
        suggestedWeight = this.roundToStep(avgWeight + step, 0.5);
        reason = `Hohe Reserve erkannt (RIR min ${minRir}). Gewicht erhöht für Progressiven Overload.`;
      } else if (lastSetRir >= 1) {
        // Moderate intensity -> Slight weight increase or maintain reps
        suggestedWeight = this.roundToStep(avgWeight + 0.5, 0.5);
        reason = 'Moderate Intensität. Leichte Gewichtserhöhung vorgeschlagen.';
      } else {
        // Low RIR on last set -> Consolidate
        reason = 'Intensitätslimit fast erreicht. Gewicht halten zur Konsolidierung.';
      }
    } else {
      // Rep-focused
      if (avgReps >= 12 && minRir >= 1) {
        suggestedWeight = this.roundToStep(avgWeight + 1.25, 0.5);
        suggestedReps = 8;
        reason = 'Rep-Limit erreicht bei ausreichender Reserve. Gewicht erhöht, Reps reduziert.';
      } else if (minRir >= 2) {
        suggestedReps = Math.round(avgReps + 2);
        reason = `Hohe Reserve (min RIR ${minRir}). Deutliche Volumensteigerung empfohlen.`;
      } else if (lastSetRir >= 1) {
        suggestedReps = Math.round(avgReps + 1);
        reason = 'Eine Wiederholung mehr zur Volumensteigerung.';
      } else {
        reason = 'Erschöpfung am Satzende erreicht. Volumen halten zur Stabilisierung.';
      }
    }

    return {
      exerciseName,
      strategy: settings.overloadStrategy,
      lastPerformance: {
        sets: lastSets.length,
        weightKg: Number(avgWeight.toFixed(2)),
        reps: Math.round(avgReps),
        date: lastPerf.sessionDate,
      },
      suggestedTarget: {
        sets: lastSets.length,
        weightKg: suggestedWeight,
        reps: suggestedReps,
      },
      reason,
    };
  }

  async getSessionProgress(
    userId: string,
    sessionId: string,
  ): Promise<TrainingSessionProgress | null> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const exercises = await this.exercises.findBySession(sessionId);
    const setLists = await Promise.all(exercises.map((exercise) => this.sets.findByExercise(exercise.id)));
    const allSets = setLists.flat();
    const totalSets = allSets.length;
    const completedSets = allSets.filter((set) => set.done).length;
    const completionPercent = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);

    return {
      totalSets,
      completedSets,
      completionPercent,
    };
  }

  async getBodyHeatmap(userId: string, days: number): Promise<BodyHeatmapInsight> {
    const safeDays = Math.max(1, Math.min(365, days));
    const cutoffMs = Date.now() - safeDays * 24 * 60 * 60 * 1000;
    const sessions = (await this.sessions.findByUser(userId)).filter(
      (session) => Date.parse(session.startedAt) >= cutoffMs,
    );

    const muscles = ALL_MUSCLE_GROUPS.reduce<Record<MuscleGroup, BodyHeatmapEntry>>(
      (acc, group) => {
        acc[group] = { totalSets: 0, completedSets: 0, sessionCount: 0 };
        return acc;
      },
      {} as Record<MuscleGroup, BodyHeatmapEntry>,
    );

    for (const session of sessions) {
      const exercises = await this.exercises.findBySession(session.id);
      const musclesSeen = new Set<MuscleGroup>();
      for (const exercise of exercises) {
        const sets = await this.sets.findByExercise(exercise.id);
        muscles[exercise.muscleGroup].totalSets += sets.length;
        muscles[exercise.muscleGroup].completedSets += sets.filter((set) => set.done).length;
        if (!musclesSeen.has(exercise.muscleGroup)) {
          muscles[exercise.muscleGroup].sessionCount++;
          musclesSeen.add(exercise.muscleGroup);
        }
      }
    }

    const totalSets = ALL_MUSCLE_GROUPS.reduce((sum, key) => sum + muscles[key].totalSets, 0);
    const totalCompletedSets = ALL_MUSCLE_GROUPS.reduce(
      (sum, key) => sum + muscles[key].completedSets,
      0,
    );

    return {
      days: safeDays,
      totalSets,
      totalCompletedSets,
      muscles,
    };
  }

  async getWorkoutCalendar(
    userId: string,
    days: number,
  ): Promise<{ date: string; sessionCount: number; templates: string[] }[]> {
    const safeDays = Math.max(1, Math.min(365, days));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - safeDays + 1);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    const sessions = (await this.sessions.findByUser(userId)).filter(
      (s) => s.date >= cutoffStr,
    );

    const byDate = new Map<string, { count: number; templates: Set<string> }>();
    for (const s of sessions) {
      if (!byDate.has(s.date)) byDate.set(s.date, { count: 0, templates: new Set() });
      const entry = byDate.get(s.date)!;
      entry.count++;
      entry.templates.add(s.templateType);
    }

    return Array.from(byDate.entries())
      .map(([date, { count, templates }]) => ({
        date,
        sessionCount: count,
        templates: Array.from(templates),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getStagnationSuggestions(
    userId: string,
    rules: StagnationRules,
  ): Promise<StagnationSuggestion[]> {
    const safeWindow = Math.max(2, Math.min(8, rules.window));
    const incrementKg = Math.max(0.5, Math.min(10, rules.incrementKg));
    const minCompletedSets = Math.max(1, Math.min(10, rules.minCompletedSets));
    const minCompletionRatio = Math.max(0.3, Math.min(1, rules.minCompletionRatio ?? 0.65));
    const deloadDropPercent = Math.max(0.05, Math.min(0.3, rules.deloadDropPercent ?? 0.1));

    const sessions = await this.listUserSessions(userId);
    const observationsByExercise = new Map<
      string,
      Array<{
        muscleGroup: MuscleGroup;
        startedAt: string;
        bestWeight: number;
        topVolume: number;
        completionRatio: number;
      }>
    >();

    for (const session of sessions) {
      const exercises = await this.exercises.findBySession(session.id);
      for (const exercise of exercises) {
        const sets = await this.sets.findByExercise(exercise.id);
        const doneSets = sets.filter((set) => set.done);
        if (doneSets.length < minCompletedSets) {
          continue;
        }
        const bestWeight = doneSets.reduce((max, set) => Math.max(max, set.weightKg), 0);
        const topVolume = doneSets.reduce((max, set) => Math.max(max, set.weightKg * set.reps), 0);
        const completionRatio = sets.length === 0 ? 0 : doneSets.length / sets.length;
        const key = exercise.exerciseName.trim().toLowerCase();
        if (!observationsByExercise.has(key)) {
          observationsByExercise.set(key, []);
        }
        observationsByExercise.get(key)!.push({
          muscleGroup: exercise.muscleGroup,
          startedAt: session.startedAt,
          bestWeight,
          topVolume,
          completionRatio,
        });
      }
    }

    const suggestions: StagnationSuggestion[] = [];

    for (const [exerciseNameKey, observations] of observationsByExercise.entries()) {
      const sorted = observations.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
      const windowSlice = sorted.slice(0, safeWindow);
      if (windowSlice.length < safeWindow) {
        continue;
      }

      const weights = windowSlice.map((entry) => entry.bestWeight);
      const volumes = windowSlice.map((entry) => entry.topVolume);
      const maxWeight = Math.max(...weights);
      const minWeight = Math.min(...weights);
      const maxVolume = Math.max(...volumes);
      const minVolume = Math.min(...volumes);
      if (maxWeight - minWeight > 0.001 || maxVolume - minVolume > 0.001) {
        continue;
      }

      const avgCompletionRatio =
        windowSlice.reduce((sum, item) => sum + item.completionRatio, 0) / windowSlice.length;
      const currentBestWeightKg = windowSlice[0].bestWeight;
      const shouldDeload = avgCompletionRatio < minCompletionRatio;
      const suggestedWeightKg = shouldDeload
        ? this.roundToStep(Math.max(0, currentBestWeightKg * (1 - deloadDropPercent)), 0.5)
        : this.roundToStep(currentBestWeightKg + incrementKg, 0.5);

      suggestions.push({
        exerciseName: exerciseNameKey,
        muscleGroup: windowSlice[0].muscleGroup,
        suggestionType: shouldDeload ? 'deload' : 'increase',
        currentBestWeightKg,
        suggestedWeightKg,
        stagnationSessions: safeWindow,
        observedCompletionRatio: Number(avgCompletionRatio.toFixed(2)),
        reason: shouldDeload
          ? `Stagnation + niedrige Completion-Quote (${Math.round(avgCompletionRatio * 100)}%)`
          : `Keine Steigerung in ${safeWindow} Sessions bei stabiler Completion-Quote`,
      });
    }

    return suggestions.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
  }

  async listCatalog(): Promise<Exercise[]> {
    const list = await this.catalog.findAll();
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCatalogExercise(id: string): Promise<Exercise | null> {
    return this.catalog.findById(id);
  }

  async createCatalogExercise(input: CreateExerciseInput): Promise<Exercise> {
    const exercise: Exercise = {
      ...baseEntity(),
      name: input.name,
      category: input.category,
      muscleGroup: input.muscleGroup,
      equipmentType: input.equipmentType ?? 'other',
    };
    return this.catalog.save(exercise);
  }

  async updateCatalogExercise(id: string, input: UpdateExerciseInput): Promise<Exercise | null> {
    const exercise = await this.catalog.findById(id);
    if (!exercise) {
      return null;
    }

    const updated: Exercise = {
      ...exercise,
      name: input.name ?? exercise.name,
      category: input.category ?? exercise.category,
      muscleGroup: input.muscleGroup ?? exercise.muscleGroup,
      equipmentType: input.equipmentType ?? exercise.equipmentType,
      updatedAt: now(),
      version: exercise.version + 1,
    };

    return this.catalog.save(updated);
  }

  async deleteCatalogExercise(id: string): Promise<boolean> {
    const exercise = await this.catalog.findById(id);
    if (!exercise) {
      return false;
    }
    await this.catalog.deleteById(id);
    return true;
  }

  async getLastExerciseSets(
    userId: string,
    exerciseName: string,
    excludeSessionId?: string,
  ): Promise<{ sessionId: string; sessionDate: string; sets: TrainingSet[] } | null> {
    const sessions = await this.listUserSessions(userId); // sorted date desc
    const normalizedName = exerciseName.trim().toLowerCase();

    for (const session of sessions) {
      if (session.id === excludeSessionId) continue;
      const exercises = await this.exercises.findBySession(session.id);
      const match = exercises.find(
        (e) => e.exerciseName.trim().toLowerCase() === normalizedName,
      );
      if (match) {
        const sets = await this.sets.findByExercise(match.id);
        return {
          sessionId: session.id,
          sessionDate: session.date,
          sets: sets.sort((a, b) => a.order - b.order),
        };
      }
    }
    return null;
  }

  private async getExerciseForUser(
    userId: string,
    sessionId: string,
    exerciseId: string,
  ): Promise<TrainingExercise | null> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const exercise = await this.exercises.findById(exerciseId);
    if (!exercise || exercise.sessionId !== sessionId) {
      return null;
    }
    return exercise;
  }

  private startOfUtcDay(value: Date): Date {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  private parseDate(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private dayDiff(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
  }

  private roundToStep(value: number, step: number): number {
    return Math.round(value / step) * step;
  }
}
