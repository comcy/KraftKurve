import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import express from 'express';
import request from 'supertest';
import { createTrainingRouter } from './training.routes';
import { TrainingService } from './training.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { IIdempotencyRecordRepository } from '../../infrastructure/repositories/idempotency-record.repository.interface';
import { IdempotencyRecord } from '../../domain/idempotency-record.entity';
import { signToken } from '../auth/jwt.util';

class MemoryIdempotencyRepository implements IIdempotencyRecordRepository {
  private readonly records: IdempotencyRecord[] = [];

  async findByRequest(
    userId: string,
    key: string,
    method: string,
    requestPath: string,
  ): Promise<IdempotencyRecord | null> {
    const hit = this.records.find(
      (record) =>
        record.userId === userId &&
        record.key === key &&
        record.method === method &&
        record.requestPath === requestPath,
    );
    return hit ?? null;
  }

  async findById(id: string): Promise<IdempotencyRecord | null> {
    return this.records.find((record) => record.id === id) ?? null;
  }

  async findAll(): Promise<IdempotencyRecord[]> {
    return [...this.records];
  }

  async findWhere(predicate: (entity: IdempotencyRecord) => boolean): Promise<IdempotencyRecord[]> {
    return this.records.filter(predicate);
  }

  async save(entity: IdempotencyRecord): Promise<IdempotencyRecord> {
    const idx = this.records.findIndex((record) => record.id === entity.id);
    if (idx >= 0) {
      this.records[idx] = entity;
    } else {
      this.records.push(entity);
    }
    return entity;
  }

  async saveMany(entities: IdempotencyRecord[]): Promise<IdempotencyRecord[]> {
    for (const entity of entities) {
      await this.save(entity);
    }
    return entities;
  }

  async deleteById(id: string): Promise<void> {
    const idx = this.records.findIndex((record) => record.id === id);
    if (idx >= 0) {
      this.records.splice(idx, 1);
    }
  }
}

function buildTestApp(responseStatus: number, responseBody?: unknown) {
  const repo = new MemoryIdempotencyRepository();
  const idempotencyService = new IdempotencyService(repo);

  const trainingService = {
    listUserSessions: async () => [],
    getSession: async () => null,
    createSession: async () => {
      if (responseStatus >= 400) {
        const message = typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody 
          ? (responseBody as Record<string, unknown>).message 
          : 'Conflict';
        const error: any = new Error(String(message));
        error.status = responseStatus;
        throw error;
      }
      return { id: 'session-1', userId: 'user-1' };
    },
    updateSession: async () => null,
    deleteSession: async () => false,
    listSessionExercises: async () => null,
    createExercise: async () => null,
    updateExercise: async () => null,
    deleteExercise: async () => false,
    listExerciseSets: async () => null,
    createSet: async () => null,
    updateSet: async () => null,
    deleteSet: async () => false,
    getSessionProgress: async () => null,
    listTemplates: async () => [],
    createTemplate: async () => null,
    updateTemplate: async () => null,
    deleteTemplate: async () => false,
    getTemplateReminders: async () => [],
    getBodyHeatmap: async () => ({ days: 28, totalSets: 0, totalCompletedSets: 0, muscles: {} }),
    getStagnationSuggestions: async () => [],
  } as unknown as TrainingService;

  const app = express();
  app.use(express.json());
  app.use('/training', createTrainingRouter(trainingService, idempotencyService));

  return app;
}

function bearer(): string {
  return `Bearer ${signToken({ sub: 'user-1', email: 'user@test.local', role: 'user' })}`;
}

describe('Training routes offline dead-letter handling', () => {
  it('returns 409 Conflict for duplicate key conflict', async () => {
    const app = buildTestApp(409, { message: 'Conflict' });

    const response = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-conflict')
      .send({ date: '2026-05-19', templateType: 'push' });

    assert.equal(response.status, 409);
  });

  it('returns 422 Unprocessable Entity for invalid data conflict', async () => {
    const app = buildTestApp(422, { message: 'Invalid state' });

    const response = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-unprocessable')
      .send({ date: '2026-05-19', templateType: 'push' });

    assert.equal(response.status, 422);
  });

  it('returns cached response when replaying 409 after conflict', async () => {
    const app = buildTestApp(409, { message: 'Conflict' });

    const first = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-replay-conflict')
      .send({ date: '2026-05-19', templateType: 'push' });

    const second = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-replay-conflict')
      .send({ date: '2026-05-19', templateType: 'push' });

    assert.equal(first.status, 409);
    assert.equal(second.status, 409);
    assert.deepEqual(second.body, first.body);
  });
});
