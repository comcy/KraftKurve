import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionEntryDto {
  id: string;
  userId: string;
  date: string;
  name: string;
  mealType: MealType;
  portionG: number;
  proteinG: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DaySummaryDto {
  date: string;
  proteinGoalG: number | null;
  totalProteinG: number;
  entries: NutritionEntryDto[];
}

export interface NutritionSettingsDto {
  proteinGoalG: number | null;
  proteinPresets: number[];
}

export interface UpdateSettingsRequest {
  proteinGoalG?: number | null;
  proteinPresets?: number[];
}

export interface FoodItemDto {
  id: string;
  userId: string;
  name: string;
  proteinPer100g: number;
  defaultPortionG: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateEntryRequest {
  date: string;
  name: string;
  mealType: MealType;
  portionG: number;
  proteinG: number;
  note?: string | null;
}

export interface UpdateEntryRequest {
  name?: string;
  mealType?: MealType;
  portionG?: number;
  proteinG?: number;
  note?: string | null;
}

export interface CreateFoodItemRequest {
  name: string;
  proteinPer100g: number;
  defaultPortionG: number;
}

export interface UpdateFoodItemRequest {
  name?: string;
  proteinPer100g?: number;
  defaultPortionG?: number;
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

const OFFLINE_QUEUE_KEY = 'kk.nutrition.offline-queue.v1';
const OFFLINE_DEAD_LETTER_KEY = 'kk.nutrition.offline-dead-letter.v1';

@Injectable({ providedIn: 'root' })
export class NutritionService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api/nutrition';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void this.flushOfflineQueue());
      void this.flushOfflineQueue();
    }
  }

  async getDaySummary(date: string): Promise<DaySummaryDto> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ summary: DaySummaryDto }>(`${this.apiBase}/day/${date}`),
      );
      return res.summary;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createEntry(req: CreateEntryRequest): Promise<NutritionEntryDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/entries`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ entry: NutritionEntryDto }>(`${this.apiBase}/entries`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.entry;
      },
    );
  }

  async getSettings(): Promise<NutritionSettingsDto> {
    try {
      return await firstValueFrom(this.http.get<NutritionSettingsDto>(`${this.apiBase}/settings`));
    } catch (error) {
      throw this.toError(error);
    }
  }

  async updateSettings(req: UpdateSettingsRequest): Promise<NutritionSettingsDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/settings`, req),
      async (operation) => {
        return await firstValueFrom(
          this.http.put<NutritionSettingsDto>(
            `${this.apiBase}/settings`,
            req,
            { headers: this.idempotencyHeaders(operation.id) },
          ),
        );
      },
    );
  }

  async getProteinGoal(): Promise<{ proteinGoalG: number | null }> {
    try {
      return await firstValueFrom(this.http.get<{ proteinGoalG: number | null }>(`${this.apiBase}/goal`));
    } catch (error) {
      throw this.toError(error);
    }
  }

  async setProteinGoal(proteinGoalG: number | null): Promise<{ proteinGoalG: number | null }> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/goal`, { proteinGoalG }),
      async (operation) => {
        return await firstValueFrom(
          this.http.put<{ proteinGoalG: number | null }>(
            `${this.apiBase}/goal`,
            { proteinGoalG },
            { headers: this.idempotencyHeaders(operation.id) },
          ),
        );
      },
    );
  }

  async updateEntry(id: string, req: UpdateEntryRequest): Promise<NutritionEntryDto> {
    return this.executeWrite(
      this.makeOperation('PUT', `${this.apiBase}/entries/${id}`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.put<{ entry: NutritionEntryDto }>(`${this.apiBase}/entries/${id}`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.entry;
      },
    );
  }

  async deleteEntry(id: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.apiBase}/entries/${id}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/entries/${id}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  async listFoodItems(): Promise<FoodItemDto[]> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ items: FoodItemDto[] }>(`${this.apiBase}/food-items`),
      );
      return res.items;
    } catch (error) {
      throw this.toError(error);
    }
  }

  async createFoodItem(req: CreateFoodItemRequest): Promise<FoodItemDto> {
    return this.executeWrite(
      this.makeOperation('POST', `${this.apiBase}/food-items`, req),
      async (operation) => {
        const res = await firstValueFrom(
          this.http.post<{ item: FoodItemDto }>(`${this.apiBase}/food-items`, req, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
        return res.item;
      },
    );
  }

  async deleteFoodItem(id: string): Promise<void> {
    await this.executeWrite(
      this.makeOperation('DELETE', `${this.apiBase}/food-items/${id}`),
      async (operation) => {
        await firstValueFrom(
          this.http.delete(`${this.apiBase}/food-items/${id}`, {
            headers: this.idempotencyHeaders(operation.id),
          }),
        );
      },
    );
  }

  getOfflineQueueSize(): number {
    return this.loadQueue().length;
  }

  getOfflineDeadLetters(): OfflineQueueDeadLetter[] {
    return this.loadDeadLetters();
  }

  clearOfflineDeadLetters(): void {
    localStorage.setItem(OFFLINE_DEAD_LETTER_KEY, JSON.stringify([]));
  }

  async flushOfflineQueue(): Promise<void> {
    const queue = this.loadQueue();
    if (queue.length === 0) return;
    const remaining: OfflineWriteOperation[] = [];
    const deadLetters = this.loadDeadLetters();
    for (const op of queue) {
      try {
        op.attempts += 1;
        await firstValueFrom(
          this.http.request(op.method, op.url, {
            body: op.body,
            headers: this.idempotencyHeaders(op.id),
          }),
        );
      } catch (error) {
        const status = error instanceof HttpErrorResponse ? error.status : null;
        if (this.isConflictStatus(status) || this.isClientError(status) || op.attempts >= 3) {
          deadLetters.push({
            operation: op,
            failedAt: new Date().toISOString(),
            status,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        } else {
          remaining.push(op);
        }
      }
    }
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    localStorage.setItem(OFFLINE_DEAD_LETTER_KEY, JSON.stringify(deadLetters));
  }

  private async executeWrite<T>(
    operation: OfflineWriteOperation,
    action: (op: OfflineWriteOperation) => Promise<T>,
  ): Promise<T> {
    try {
      return await action(operation);
    } catch (error) {
      if (!navigator.onLine || this.isNetworkError(error)) {
        this.enqueue(operation);
        throw new Error('Offline: operation queued for later sync');
      }
      throw this.toError(error);
    }
  }

  private makeOperation(
    method: 'POST' | 'PUT' | 'DELETE',
    url: string,
    body?: unknown,
  ): OfflineWriteOperation {
    return {
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      method,
      url,
      body,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };
  }

  private idempotencyHeaders(key: string): HttpHeaders {
    return new HttpHeaders({ 'x-idempotency-key': key });
  }

  private enqueue(operation: OfflineWriteOperation): void {
    const queue = this.loadQueue();
    queue.push(operation);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }

  private loadQueue(): OfflineWriteOperation[] {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]') as OfflineWriteOperation[];
    } catch {
      return [];
    }
  }

  private loadDeadLetters(): OfflineQueueDeadLetter[] {
    try {
      return JSON.parse(
        localStorage.getItem(OFFLINE_DEAD_LETTER_KEY) ?? '[]',
      ) as OfflineQueueDeadLetter[];
    } catch {
      return [];
    }
  }

  private isConflictStatus(status: number | null): boolean {
    return status === 409 || status === 412 || status === 422;
  }

  private isClientError(status: number | null): boolean {
    return status !== null && status >= 400 && status < 500;
  }

  private isNetworkError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 0;
  }

  private toError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      return new Error(`HTTP ${error.status}: ${error.message}`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
