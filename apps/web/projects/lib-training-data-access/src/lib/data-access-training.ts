import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type WorkoutTemplate = 'push' | 'pull' | 'legs' | 'full-body' | 'custom';
export type OverloadStrategy = 'weight-focused' | 'rep-focused';

export interface TrainingSessionDto {
  id: string;
  userId: string;
  planId: string | null;
  planName?: string;
  routineId: string | null;
  routineName?: string;
  date: string;
  startedAt: string;
  finishedAt: string | null;
  totalSeconds: number;
  isPaused: boolean;
  exerciseCount?: number;
  templateType: WorkoutTemplate;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateTrainingSessionRequest {
  date: string;
  templateType: WorkoutTemplate;
  planId?: string | null;
  routineId?: string | null;
  note?: string | null;
  totalSeconds?: number;
  isPaused?: boolean;
}

export interface UpdateTrainingSessionRequest {
  date?: string;
  templateType?: WorkoutTemplate;
  planId?: string | null;
  routineId?: string | null;
  note?: string | null;
  finishedAt?: string | null;
  totalSeconds?: number;
  isPaused?: boolean;
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'legs'
  | 'full-body'
  | 'cardio';

export interface TrainingExerciseDto {
  id: string;
  sessionId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  order: number;
  supersetGroupId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TrainingSetDto {
  id: string;
  trainingExerciseId: string;
  order: number;
  reps: number;
  weightKg: number;
  rir: number | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CardioRecordDto {
  id: string;
  trainingExerciseId: string;
  durationSeconds: number;
  distanceMeters: number | null;
  caloriesBurned: number | null;
  heartRateAverage: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TrainingPlanDto {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  sessionsPerWeek: number;
  note: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TrainingRoutineDto {
  id: string;
  planId: string;
  name: string;
  order: number;
  exerciseCount: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TrainingRoutineExerciseDto {
  id: string;
  routineId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  order: number;
  supersetGroupId: string | null;
  suggestedSets: number;
}

export interface TrainingSettingsDto {
  userId: string;
  overloadStrategy: OverloadStrategy;
  virtualTrainerEnabled: boolean;
}

export interface ExerciseSuggestionDto {
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

export interface TrainingSessionProgressDto {
  totalSets: number;
  completedSets: number;
  completionPercent: number;
}


export interface CreateTrainingExerciseRequest {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  note?: string | null;
}

export interface UpdateTrainingExerciseRequest {
  exerciseName?: string;
  muscleGroup?: MuscleGroup;
  note?: string | null;
  order?: number;
  supersetGroupId?: string | null;
}

export interface CreateTrainingSetRequest {
  reps: number;
  weightKg: number;
  rir?: number | null;
  done?: boolean;
}

export interface UpdateTrainingSetRequest {
  reps?: number;
  weightKg?: number;
  rir?: number | null;
  done?: boolean;
  order?: number;
}

export interface CreateCardioRecordRequest {
  durationSeconds: number;
  distanceMeters?: number | null;
  caloriesBurned?: number | null;
  heartRateAverage?: number | null;
  note?: string | null;
}

export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'other';
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'other';

export interface ExerciseDto {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  equipmentType?: EquipmentType;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateExerciseRequest {
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  equipmentType?: EquipmentType;
}

export interface UpdateExerciseRequest {
  name?: string;
  category?: ExerciseCategory;
  muscleGroup?: MuscleGroup;
  equipmentType?: EquipmentType;
}

export interface CreateTrainingPlanRequest {
  name: string;
  startDate: string;
  endDate: string;
  sessionsPerWeek: number;
  note?: string | null;
  active?: boolean;
}

export interface UpdateTrainingPlanRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  sessionsPerWeek?: number;
  note?: string | null;
  active?: boolean;
}

type OfflineWriteOperation = {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  body?: unknown;
  queuedAt: string;
  attempts: number;
};

export interface OfflineQueueDeadLetter {
  operation: OfflineWriteOperation;
  failedAt: string;
  status: number | null;
  message: string;
}

const OFFLINE_QUEUE_KEY = 'kk.training.offline-queue.v2';
const OFFLINE_DEAD_LETTER_KEY = 'kk.training.offline-dead-letter.v2';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api/training';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.flushOfflineQueue();
      });
      void this.flushOfflineQueue();
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  async listSessions(): Promise<TrainingSessionDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ sessions: TrainingSessionDto[] }>(`${this.apiBase}/sessions`),
      );
      return res.sessions;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async getSession(id: string): Promise<TrainingSessionDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ session: TrainingSessionDto }>(`${this.apiBase}/sessions/${id}`),
      );
      return res.session;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createSession(req: CreateTrainingSessionRequest): Promise<TrainingSessionDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/sessions`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ session: TrainingSessionDto }>(`${this.apiBase}/sessions`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.session;
      },
    );
  }

  async updateSession(
    id: string,
    req: UpdateTrainingSessionRequest,
  ): Promise<TrainingSessionDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/sessions/${id}`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ session: TrainingSessionDto }>(`${this.apiBase}/sessions/${id}`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.session;
      },
    );
  }

  async deleteSession(id: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.apiBase}/sessions/${id}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/sessions/${id}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  // ── Exercises & Sets & Cardio ──────────────────────────────────────────

  async listExercises(sessionId: string): Promise<TrainingExerciseDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ exercises: TrainingExerciseDto[] }>(`${this.apiBase}/sessions/${sessionId}/exercises`),
      );
      return res.exercises;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createExercise(
    sessionId: string,
    req: CreateTrainingExerciseRequest,
  ): Promise<TrainingExerciseDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/sessions/${sessionId}/exercises`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ exercise: TrainingExerciseDto }>(
            `${this.apiBase}/sessions/${sessionId}/exercises`,
            req,
            {
              headers: this.idempotencyHeaders(operation.id),
            },
          ),
        );
        return res.exercise;
      },
    );
  }

  async updateExercise(
    sessionId: string,
    exerciseId: string,
    req: UpdateTrainingExerciseRequest,
  ): Promise<TrainingExerciseDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ exercise: TrainingExerciseDto }>(
            `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}`,
            req,
            {
              headers: this.idempotencyHeaders(operation.id),
            },
          ),
        );
        return res.exercise;
      },
    );
  }

  async deleteExercise(sessionId: string, exerciseId: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  async listSets(sessionId: string, exerciseId: string): Promise<TrainingSetDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ sets: TrainingSetDto[] }>(
          `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/sets`,
        ),
      );
      return res.sets;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createSet(
    sessionId: string,
    exerciseId: string,
    req: CreateTrainingSetRequest,
  ): Promise<TrainingSetDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/sets`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ set: TrainingSetDto }>(
            `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/sets`,
            req,
            {
              headers: this.idempotencyHeaders(operation.id),
            },
          ),
        );
        return res.set;
      },
    );
  }

  async updateSet(
    sessionId: string,
    exerciseId: string,
    setId: string,
    req: UpdateTrainingSetRequest,
  ): Promise<TrainingSetDto> {
    return this.executeWrite(
      this.makeOperation(
        'PUT',
        `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/sets/${setId}`,
        req,
      ),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ set: TrainingSetDto }>(
            `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/sets/${setId}`,
            req,
            {
              headers: this.idempotencyHeaders(operation.id),
            },
          ),
        );
        return res.set;
      },
    );
  }

  async deleteSet(sessionId: string, exerciseId: string, setId: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/sets/${setId}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/sets/${setId}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  async getCardioRecord(sessionId: string, exerciseId: string): Promise<CardioRecordDto | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ record: CardioRecordDto | null }>(
          `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/cardio`,
        ),
      );
      return res.record;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createCardioRecord(
    sessionId: string,
    exerciseId: string,
    req: CreateCardioRecordRequest,
  ): Promise<CardioRecordDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/cardio`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ record: CardioRecordDto }>(
            `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/cardio`,
            req,
            {
              headers: this.idempotencyHeaders(operation.id),
            },
          ),
        );
        return res.record;
      },
    );
  }

  async updateCardioRecord(
    sessionId: string,
    exerciseId: string,
    req: Partial<CreateCardioRecordRequest>,
  ): Promise<CardioRecordDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/cardio`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ record: CardioRecordDto }>(
            `${this.apiBase}/sessions/${sessionId}/exercises/${exerciseId}/cardio`,
            req,
            {
              headers: this.idempotencyHeaders(operation.id),
            },
          ),
        );
        return res.record;
      },
    );
  }

  // ── Plans & Routines ─────────────────────────────────────────────────────

  async listPlans(): Promise<TrainingPlanDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ plans: TrainingPlanDto[] }>(`${this.apiBase}/plans`),
      );
      return res.plans;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createPlan(req: CreateTrainingPlanRequest): Promise<TrainingPlanDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/plans`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ plan: TrainingPlanDto }>(`${this.apiBase}/plans`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.plan;
      },
    );
  }

  async updatePlan(id: string, req: UpdateTrainingPlanRequest): Promise<TrainingPlanDto> {
    try {
      const res = await firstValueFrom(
        this.http.put<{ plan: TrainingPlanDto }>(`${this.apiBase}/plans/${id}`, req),
      );
      return res.plan;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async deletePlan(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiBase}/plans/${id}`));
    } catch (error) {
      throw this.toError(error);
    }
  }

  async listRoutines(planId: string): Promise<TrainingRoutineDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ routines: TrainingRoutineDto[] }>(`${this.apiBase}/plans/${planId}/routines`),
      );
      return res.routines;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createRoutine(planId: string, name: string): Promise<TrainingRoutineDto> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ routine: TrainingRoutineDto }>(`${this.apiBase}/plans/${planId}/routines`, { name }),
      );
      return res.routine;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async getRoutine(id: string): Promise<TrainingRoutineDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ routine: TrainingRoutineDto }>(`${this.apiBase}/routines/${id}`),
      );
      return res.routine;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async updateRoutine(id: string, name: string, order?: number): Promise<TrainingRoutineDto> {
    try {
      const res = await firstValueFrom(
        this.http.put<{ routine: TrainingRoutineDto }>(`${this.apiBase}/routines/${id}`, { name, order }),
      );
      return res.routine;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async deleteRoutine(routineId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiBase}/routines/${routineId}`));
    } catch (error) {
      throw this.toError(error);
    }
  }

  async listRoutineExercises(routineId: string): Promise<TrainingRoutineExerciseDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ exercises: TrainingRoutineExerciseDto[] }>(`${this.apiBase}/routines/${routineId}/exercises`),
      );
      return res.exercises;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async addRoutineExercise(
    routineId: string,
    req: { exerciseId?: string; exerciseName: string; muscleGroup: MuscleGroup; suggestedSets: number },
  ): Promise<TrainingRoutineExerciseDto> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ exercise: TrainingRoutineExerciseDto }>(`${this.apiBase}/routines/${routineId}/exercises`, req),
      );
      return res.exercise;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async updateRoutineExercise(
    id: string,
    req: { suggestedSets?: number; order?: number; supersetGroupId?: string | null },
  ): Promise<TrainingRoutineExerciseDto> {
    try {
      const res = await firstValueFrom(
        this.http.put<{ exercise: TrainingRoutineExerciseDto }>(`${this.apiBase}/routine-exercises/${id}`, req),
      );
      return res.exercise;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async deleteRoutineExercise(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiBase}/routine-exercises/${id}`));
    } catch (error) {
      throw this.toError(error);
    }
  }

  // ── Virtual Trainer & Settings ───────────────────────────────────────────

  async getTrainingSettings(): Promise<TrainingSettingsDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ settings: TrainingSettingsDto }>(`${this.apiBase}/settings`),
      );
      return res.settings;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async updateTrainingSettings(input: { strategy?: OverloadStrategy; virtualTrainerEnabled?: boolean }): Promise<TrainingSettingsDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/settings`, { 
        overloadStrategy: input.strategy,
        virtualTrainerEnabled: input.virtualTrainerEnabled 
      }),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ settings: TrainingSettingsDto }>(`${this.apiBase}/settings`, { 
            overloadStrategy: input.strategy,
            virtualTrainerEnabled: input.virtualTrainerEnabled 
          }, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.settings;
      },
    );
  }

  async getSuggestion(exerciseName: string, excludeSessionId?: string): Promise<ExerciseSuggestionDto | null> {
    try {
      const params: any = { name: exerciseName };
      if (excludeSessionId) params.sessionId = excludeSessionId;

      const res = await firstValueFrom(
        this.http.get<{ suggestion: ExerciseSuggestionDto | null }>(
          `${this.apiBase}/suggestions`, { params }
        ),
      );
      return res.suggestion;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async listCatalog(): Promise<ExerciseDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ catalog: ExerciseDto[] }>(`${this.apiBase}/catalog`),
      );
      return res.catalog;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createCatalogExercise(req: CreateExerciseRequest): Promise<ExerciseDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/catalog`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ exercise: ExerciseDto }>(`${this.apiBase}/catalog`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.exercise;
      },
    );
  }

  async updateCatalogExercise(id: string, req: UpdateExerciseRequest): Promise<ExerciseDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/catalog/${id}`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ exercise: ExerciseDto }>(`${this.apiBase}/catalog/${id}`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.exercise;
      },
    );
  }

  async deleteCatalogExercise(id: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.apiBase}/catalog/${id}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/catalog/${id}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  // ── Implementation Details (Offline, Headers, Errors) ──────────────────────

  async flushOfflineQueue(): Promise<number> {
    const queue = this.readQueue();
    if (!queue.length) {
      return 0;
    }

    let flushed = 0;
    const pending: OfflineWriteOperation[] = [];
    const deadLetters = this.readDeadLetters();
    for (let i = 0; i < queue.length; i += 1) {
      const operation = queue[i];
      try {
        await firstValueFrom(
          this.http.request(operation.method, operation.url, {
            body: operation.body,
            observe: 'body',
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        flushed += 1;
      } catch (error) {
        if (this.isOfflineError(error)) {
          pending.push(...queue.slice(i));
          break;
        }

        const attempts = (operation.attempts ?? 0) + 1;
        const status = error instanceof HttpErrorResponse ? error.status : null;
        const message = this.toError(error).message;

        if (this.isConflictStatus(status) || this.isClientError(status) || attempts >= 3) {
          deadLetters.push({
            operation: { ...operation, attempts },
            failedAt: new Date().toISOString(),
            status,
            message,
          });
          continue;
        }

        pending.push({ ...operation, attempts });
        pending.push(...queue.slice(i + 1));
        break;
      }
    }
    this.writeQueue(pending);
    this.writeDeadLetters(deadLetters);
    return flushed;
  }

  private async executeWrite<T>(
    operation: OfflineWriteOperation,
    action: (operation: OfflineWriteOperation) => Promise<T>,
  ): Promise<T> {
    try {
      return await action(operation);
    } catch (error) {
      if (this.isOfflineError(error)) {
        this.enqueue(operation);
        throw new Error('Offline erkannt: Aktion wurde in die Queue gelegt.');
      }
      throw this.toError(error);
    }
  }

  private isOfflineError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine));
  }

  private enqueue(operation: OfflineWriteOperation): void {
    const queue = this.readQueue();
    queue.push({ ...operation, attempts: operation.attempts ?? 0 });
    this.writeQueue(queue);
  }

  private makeOperation(method: OfflineWriteOperation['method'], url: string, body?: unknown): OfflineWriteOperation {
    return { id: this.generateOperationId(), method, url, body, queuedAt: new Date().toISOString(), attempts: 0 };
  }

  private readQueue(): OfflineWriteOperation[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private readDeadLetters(): OfflineQueueDeadLetter[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_DEAD_LETTER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private writeQueue(queue: OfflineWriteOperation[]): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  private writeDeadLetters(deadLetters: OfflineQueueDeadLetter[]): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(OFFLINE_DEAD_LETTER_KEY, JSON.stringify(deadLetters));
  }

  private isConflictStatus(status: number | null): boolean { return status === 409 || status === 412 || status === 422; }
  private isClientError(status: number | null): boolean { return status !== null && status >= 400 && status < 500; }
  private generateOperationId(): string { return typeof crypto !== 'undefined' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
  private idempotencyHeaders(key: string): HttpHeaders { return new HttpHeaders({ 'x-idempotency-key': key }); }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      const errBody = error.error;
      const message = typeof errBody === 'object' && errBody !== null
        ? (errBody.error || errBody.message || JSON.stringify(errBody))
        : error.message;
      return new Error(message || 'Request failed');
    }
    return error instanceof Error ? error : new Error('Request failed');
  }
}
