import { v4 as uuidv4 } from 'uuid';
import { TrainingSession, WorkoutTemplate } from '../../domain/training-session.entity';
import { ITrainingSessionRepository } from '../../infrastructure/repositories/training-session.repository.interface';
import { ITrainingExerciseRepository } from '../../infrastructure/repositories/training-exercise.repository.interface';
import { ITrainingSetRepository } from '../../infrastructure/repositories/training-set.repository.interface';
import { MuscleGroup, TrainingExercise } from '../../domain/training-exercise.entity';
import { TrainingSet } from '../../domain/training-set.entity';
import {
  TrainingPlanTemplate,
  TrainingPlanTemplateReminder,
} from '../../domain/training-plan-template.entity';
import { ITrainingPlanTemplateRepository } from '../../infrastructure/repositories/training-plan-template.repository.interface';

export interface CreateTrainingSessionInput {
  date: string;
  templateType: WorkoutTemplate;
  note?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
}

export interface UpdateTrainingSessionInput {
  date?: string;
  templateType?: WorkoutTemplate;
  note?: string | null;
  startedAt?: string;
  finishedAt?: string | null;
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

export interface TrainingSessionProgress {
  totalSets: number;
  completedSets: number;
  completionPercent: number;
}

export interface CreateTrainingPlanTemplateInput {
  name: string;
  templateType: WorkoutTemplate;
  startDate: string;
  endDate: string;
  reminderDaysBefore?: number;
  note?: string | null;
  active?: boolean;
}

export interface UpdateTrainingPlanTemplateInput {
  name?: string;
  templateType?: WorkoutTemplate;
  startDate?: string;
  endDate?: string;
  reminderDaysBefore?: number;
  note?: string | null;
  active?: boolean;
}

export interface BodyHeatmapEntry {
  totalSets: number;
  completedSets: number;
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
    private readonly templates: ITrainingPlanTemplateRepository,
  ) {}

  async listUserSessions(userId: string): Promise<TrainingSession[]> {
    const list = await this.sessions.findByUser(userId);
    return list.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async getSession(userId: string, sessionId: string): Promise<TrainingSession | null> {
    const session = await this.sessions.findById(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }
    return session;
  }

  async createSession(
    userId: string,
    input: CreateTrainingSessionInput,
  ): Promise<TrainingSession> {
    const session: TrainingSession = {
      ...baseEntity(),
      userId,
      date: input.date,
      templateType: input.templateType,
      note: input.note ?? null,
      startedAt: input.startedAt ?? now(),
      finishedAt: input.finishedAt ?? null,
    };
    return this.sessions.save(session);
  }

  async updateSession(
    userId: string,
    sessionId: string,
    input: UpdateTrainingSessionInput,
  ): Promise<TrainingSession | null> {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const updated: TrainingSession = {
      ...session,
      date: input.date ?? session.date,
      templateType: input.templateType ?? session.templateType,
      note: input.note === undefined ? session.note : input.note,
      startedAt: input.startedAt ?? session.startedAt,
      finishedAt: input.finishedAt === undefined ? session.finishedAt : input.finishedAt,
      updatedAt: now(),
      version: session.version + 1,
    };

    return this.sessions.save(updated);
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

  async listTemplates(userId: string): Promise<TrainingPlanTemplate[]> {
    const templates = await this.templates.findByUser(userId);
    return templates.sort((a, b) => a.endDate.localeCompare(b.endDate));
  }

  async createTemplate(
    userId: string,
    input: CreateTrainingPlanTemplateInput,
  ): Promise<TrainingPlanTemplate> {
    const template: TrainingPlanTemplate = {
      ...baseEntity(),
      userId,
      name: input.name,
      templateType: input.templateType,
      startDate: input.startDate,
      endDate: input.endDate,
      reminderDaysBefore: input.reminderDaysBefore ?? 7,
      note: input.note ?? null,
      active: input.active ?? true,
    };
    return this.templates.save(template);
  }

  async updateTemplate(
    userId: string,
    templateId: string,
    input: UpdateTrainingPlanTemplateInput,
  ): Promise<TrainingPlanTemplate | null> {
    const template = await this.templates.findById(templateId);
    if (!template || template.userId !== userId) {
      return null;
    }

    const updated: TrainingPlanTemplate = {
      ...template,
      name: input.name ?? template.name,
      templateType: input.templateType ?? template.templateType,
      startDate: input.startDate ?? template.startDate,
      endDate: input.endDate ?? template.endDate,
      reminderDaysBefore: input.reminderDaysBefore ?? template.reminderDaysBefore,
      note: input.note === undefined ? template.note : input.note,
      active: input.active ?? template.active,
      updatedAt: now(),
      version: template.version + 1,
    };

    return this.templates.save(updated);
  }

  async deleteTemplate(userId: string, templateId: string): Promise<boolean> {
    const template = await this.templates.findById(templateId);
    if (!template || template.userId !== userId) {
      return false;
    }
    await this.templates.deleteById(templateId);
    return true;
  }

  async getTemplateReminders(userId: string, withinDays: number): Promise<TrainingPlanTemplateReminder[]> {
    const templates = await this.templates.findByUser(userId);
    const today = this.startOfUtcDay(new Date());

    return templates
      .filter((template) => template.active)
      .map((template) => {
        const endDate = this.parseDate(template.endDate);
        const daysRemaining = this.dayDiff(today, endDate);
        const threshold = Math.max(0, Math.min(withinDays, template.reminderDaysBefore));
        const status: 'expired' | 'expiring' = daysRemaining < 0 ? 'expired' : 'expiring';
        return { template, daysRemaining, threshold, status };
      })
      .filter((entry) => entry.daysRemaining < 0 || entry.daysRemaining <= entry.threshold)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .map((entry) => ({
        templateId: entry.template.id,
        templateName: entry.template.name,
        endDate: entry.template.endDate,
        daysRemaining: entry.daysRemaining,
        status: entry.status,
      }));
  }

  async getBodyHeatmap(userId: string, days: number): Promise<BodyHeatmapInsight> {
    const safeDays = Math.max(1, Math.min(365, days));
    const cutoffMs = Date.now() - safeDays * 24 * 60 * 60 * 1000;
    const sessions = (await this.sessions.findByUser(userId)).filter(
      (session) => Date.parse(session.startedAt) >= cutoffMs,
    );

    const muscles = ALL_MUSCLE_GROUPS.reduce<Record<MuscleGroup, BodyHeatmapEntry>>(
      (acc, group) => {
        acc[group] = { totalSets: 0, completedSets: 0 };
        return acc;
      },
      {} as Record<MuscleGroup, BodyHeatmapEntry>,
    );

    for (const session of sessions) {
      const exercises = await this.exercises.findBySession(session.id);
      for (const exercise of exercises) {
        const sets = await this.sets.findByExercise(exercise.id);
        muscles[exercise.muscleGroup].totalSets += sets.length;
        muscles[exercise.muscleGroup].completedSets += sets.filter((set) => set.done).length;
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
