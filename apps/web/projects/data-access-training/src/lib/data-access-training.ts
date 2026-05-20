import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type WorkoutTemplate = 'push' | 'pull' | 'legs' | 'full-body' | 'custom';

export interface TrainingSessionDto {
  id: string;
  userId: string;
  date: string;
  startedAt: string;
  finishedAt: string | null;
  templateType: WorkoutTemplate;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateTrainingSessionRequest {
  date: string;
  templateType: WorkoutTemplate;
  note?: string | null;
}

export interface UpdateTrainingSessionRequest {
  date?: string;
  templateType?: WorkoutTemplate;
  note?: string | null;
  finishedAt?: string | null;
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
  | 'full-body'
  | 'cardio';

export interface TrainingExerciseDto {
  id: string;
  sessionId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  order: number;
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
  done: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
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
}

export interface CreateTrainingSetRequest {
  reps: number;
  weightKg: number;
  done?: boolean;
}

export interface UpdateTrainingSetRequest {
  reps?: number;
  weightKg?: number;
  done?: boolean;
  order?: number;
}

export interface TrainingPlanTemplateDto {
  id: string;
  userId: string;
  name: string;
  templateType: WorkoutTemplate;
  startDate: string;
  endDate: string;
  reminderDaysBefore: number;
  note: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export type TemplateReminderStatus = 'expiring' | 'expired';

export interface TrainingPlanTemplateReminderDto {
  templateId: string;
  templateName: string;
  endDate: string;
  daysRemaining: number;
  status: TemplateReminderStatus;
}

export interface BodyHeatmapEntryDto {
  totalSets: number;
  completedSets: number;
}

export interface BodyHeatmapDto {
  days: number;
  totalSets: number;
  totalCompletedSets: number;
  muscles: Record<MuscleGroup, BodyHeatmapEntryDto>;
}

export interface StagnationSuggestionDto {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  suggestionType: 'increase' | 'deload';
  currentBestWeightKg: number;
  suggestedWeightKg: number;
  stagnationSessions: number;
  observedCompletionRatio: number;
  reason: string;
}

export interface ExerciseHistorySetDto {
  order: number;
  reps: number;
  weightKg: number;
  done: boolean;
}

export interface ExerciseHistoryDto {
  sessionId: string;
  sessionDate: string;
  sets: ExerciseHistorySetDto[];
}

export interface CreateTrainingPlanTemplateRequest {
  name: string;
  templateType: WorkoutTemplate;
  startDate: string;
  endDate: string;
  reminderDaysBefore?: number;
  note?: string | null;
  active?: boolean;
}

export interface UpdateTrainingPlanTemplateRequest {
  name?: string;
  templateType?: WorkoutTemplate;
  startDate?: string;
  endDate?: string;
  reminderDaysBefore?: number;
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

const OFFLINE_QUEUE_KEY = 'kk.training.offline-queue.v1';
const OFFLINE_DEAD_LETTER_KEY = 'kk.training.offline-dead-letter.v1';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api/training/sessions';
  private readonly templatesBase = '/api/training/templates';
  private readonly insightsBase = '/api/training/insights';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        void this.flushOfflineQueue();
      });
      void this.flushOfflineQueue();
    }
  }

  async listSessions(): Promise<TrainingSessionDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ sessions: TrainingSessionDto[] }>(this.apiBase),
      );
      return res.sessions;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async getSession(id: string): Promise<TrainingSessionDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ session: TrainingSessionDto }>(`${this.apiBase}/${id}`),
      );
      return res.session;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createSession(req: CreateTrainingSessionRequest): Promise<TrainingSessionDto> {
    return this.executeWrite(
      this.makeOperation('POST', this.apiBase, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ session: TrainingSessionDto }>(this.apiBase, req, {
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
      this.makeOperation('PUT', `${this.apiBase}/${id}`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ session: TrainingSessionDto }>(`${this.apiBase}/${id}`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.session;
      },
    );
  }

  async deleteSession(id: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.apiBase}/${id}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/${id}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  async listExercises(sessionId: string): Promise<TrainingExerciseDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ exercises: TrainingExerciseDto[] }>(`${this.apiBase}/${sessionId}/exercises`),
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
      this.makeOperation('POST', `${this.apiBase}/${sessionId}/exercises`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ exercise: TrainingExerciseDto }>(
            `${this.apiBase}/${sessionId}/exercises`,
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
      this.makeOperation('PUT', `${this.apiBase}/${sessionId}/exercises/${exerciseId}`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ exercise: TrainingExerciseDto }>(
            `${this.apiBase}/${sessionId}/exercises/${exerciseId}`,
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
      this.makeOperation('DELETE', `${this.apiBase}/${sessionId}/exercises/${exerciseId}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/${sessionId}/exercises/${exerciseId}`, {
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
          `${this.apiBase}/${sessionId}/exercises/${exerciseId}/sets`,
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
      this.makeOperation('POST', `${this.apiBase}/${sessionId}/exercises/${exerciseId}/sets`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ set: TrainingSetDto }>(
            `${this.apiBase}/${sessionId}/exercises/${exerciseId}/sets`,
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
        `${this.apiBase}/${sessionId}/exercises/${exerciseId}/sets/${setId}`,
        req,
      ),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ set: TrainingSetDto }>(
            `${this.apiBase}/${sessionId}/exercises/${exerciseId}/sets/${setId}`,
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
      this.makeOperation('DELETE', `${this.apiBase}/${sessionId}/exercises/${exerciseId}/sets/${setId}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/${sessionId}/exercises/${exerciseId}/sets/${setId}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  async getProgress(sessionId: string): Promise<TrainingSessionProgressDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ progress: TrainingSessionProgressDto }>(`${this.apiBase}/${sessionId}/progress`),
      );
      return res.progress;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async listTemplates(): Promise<TrainingPlanTemplateDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ templates: TrainingPlanTemplateDto[] }>(this.templatesBase),
      );
      return res.templates;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createTemplate(req: CreateTrainingPlanTemplateRequest): Promise<TrainingPlanTemplateDto> {
    return this.executeWrite(
      this.makeOperation('POST', this.templatesBase, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ template: TrainingPlanTemplateDto }>(this.templatesBase, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.template;
      },
    );
  }

  async updateTemplate(
    templateId: string,
    req: UpdateTrainingPlanTemplateRequest,
  ): Promise<TrainingPlanTemplateDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.templatesBase}/${templateId}`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ template: TrainingPlanTemplateDto }>(
            `${this.templatesBase}/${templateId}`,
            req,
            {
              headers: this.idempotencyHeaders(operation.id),
            },
          ),
        );
        return res.template;
      },
    );
  }

  async deleteTemplate(templateId: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.templatesBase}/${templateId}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.templatesBase}/${templateId}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  async getTemplateReminders(withinDays = 14): Promise<TrainingPlanTemplateReminderDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ reminders: TrainingPlanTemplateReminderDto[] }>(
          `${this.templatesBase}/reminders?withinDays=${withinDays}`,
        ),
      );
      return res.reminders;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async getBodyHeatmap(days = 28): Promise<BodyHeatmapDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ heatmap: BodyHeatmapDto }>(`${this.insightsBase}/heatmap?days=${days}`),
      );
      return res.heatmap;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async getStagnationSuggestions(
    window = 3,
    incrementKg = 2.5,
    minCompletedSets = 2,
    minCompletionRatio = 0.65,
    deloadDropPercent = 0.1,
  ): Promise<StagnationSuggestionDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ suggestions: StagnationSuggestionDto[] }>(
          `${this.insightsBase}/stagnation-suggestions?window=${window}&incrementKg=${incrementKg}&minCompletedSets=${minCompletedSets}&minCompletionRatio=${minCompletionRatio}&deloadDropPercent=${deloadDropPercent}`,
        ),
      );
      return res.suggestions;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async getExerciseHistory(
    exerciseName: string,
    excludeSessionId?: string,
  ): Promise<ExerciseHistoryDto | null> {
    try {
      const params = new URLSearchParams({ name: exerciseName });
      if (excludeSessionId) params.set('excludeSession', excludeSessionId);
      const res = await firstValueFrom(
        this.http.get<{ history: ExerciseHistoryDto | null }>(
          `/api/training/exercises/history?${params.toString()}`,
        ),
      );
      return res.history;
    } catch (error) {
      throw this.toError(error);
    }
  }

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

  getOfflineQueueSize(): number {
    return this.readQueue().length;
  }

  getOfflineDeadLetters(): OfflineQueueDeadLetter[] {
    return this.readDeadLetters();
  }

  clearOfflineDeadLetters(): void {
    this.writeDeadLetters([]);
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
        throw new Error('Offline erkannt: Aktion wurde in die Queue gelegt und wird online synchronisiert.');
      }
      throw this.toError(error);
    }
  }

  private isOfflineError(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    if (error.status === 0) {
      return true;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return true;
    }

    return false;
  }

  private enqueue(operation: OfflineWriteOperation): void {
    const queue = this.readQueue();
    queue.push({ ...operation, attempts: operation.attempts ?? 0 });
    this.writeQueue(queue);
  }

  private makeOperation(
    method: OfflineWriteOperation['method'],
    url: string,
    body?: unknown,
  ): OfflineWriteOperation {
    return {
      id: this.generateOperationId(),
      method,
      url,
      body,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };
  }

  private readQueue(): OfflineWriteOperation[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as Array<Partial<OfflineWriteOperation>>;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter((item) => typeof item.method === 'string' && typeof item.url === 'string')
        .map((item) => ({
          id: typeof item.id === 'string' ? item.id : this.generateOperationId(),
          method: item.method as OfflineWriteOperation['method'],
          url: item.url as string,
          body: item.body,
          queuedAt: typeof item.queuedAt === 'string' ? item.queuedAt : new Date().toISOString(),
          attempts: typeof item.attempts === 'number' && item.attempts > 0 ? item.attempts : 0,
        }));
    } catch {
      return [];
    }
  }

  private readDeadLetters(): OfflineQueueDeadLetter[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(OFFLINE_DEAD_LETTER_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as OfflineQueueDeadLetter[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: OfflineWriteOperation[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // Ignore storage write issues so user actions do not hard fail.
    }
  }

  private writeDeadLetters(deadLetters: OfflineQueueDeadLetter[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(OFFLINE_DEAD_LETTER_KEY, JSON.stringify(deadLetters));
    } catch {
      // Ignore storage write issues so user actions do not hard fail.
    }
  }

  private isConflictStatus(status: number | null): boolean {
    return status === 409 || status === 412 || status === 422;
  }

  private isClientError(status: number | null): boolean {
    return status !== null && status >= 400 && status < 500;
  }

  private generateOperationId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }

  private idempotencyHeaders(key: string): HttpHeaders {
    return new HttpHeaders({ 'x-idempotency-key': key });
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      const message =
        typeof error.error?.error === 'string'
          ? error.error.error
          : typeof error.error?.message === 'string'
            ? error.error.message
            : error.message;
      return new Error(message || 'Request failed');
    }
    return error instanceof Error ? error : new Error('Request failed');
  }
}
