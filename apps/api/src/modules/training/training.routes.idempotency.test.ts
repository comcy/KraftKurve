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

function buildTestApp(
  createSessionImpl?: (input: unknown) => Promise<unknown>,
  updateSessionImpl?: (userId: string, sessionId: string, input: unknown) => Promise<unknown>,
  deleteSessionImpl?: (userId: string, sessionId: string) => Promise<boolean>,
) {
  const repo = new MemoryIdempotencyRepository();
  const idempotencyService = new IdempotencyService(repo);

  let createCalls = 0;
  let updateCalls = 0;
  let deleteCalls = 0;

  const trainingService = {
    listUserSessions: async () => [],
    getSession: async () => null,
    createSession: async (_userId: string, input: unknown) => {
      createCalls += 1;
      return createSessionImpl?.(input) ?? null;
    },
    updateSession: async (userId: string, sessionId: string, input: unknown) => {
      updateCalls += 1;
      return updateSessionImpl?.(userId, sessionId, input) ?? null;
    },
    deleteSession: async (userId: string, sessionId: string) => {
      deleteCalls += 1;
      return deleteSessionImpl?.(userId, sessionId) ?? false;
    },
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

  return {
    app,
    getCreateCalls: () => createCalls,
    getUpdateCalls: () => updateCalls,
    getDeleteCalls: () => deleteCalls,
  };
}

function bearer(): string {
  return `Bearer ${signToken({ sub: 'user-1', email: 'user@test.local', role: 'user' })}`;
}

describe('Training routes idempotency', () => {
  it('replays POST /sessions when x-idempotency-key matches', async () => {
    let counter = 0;
    const { app, getCreateCalls } = buildTestApp(async () => {
      counter += 1;
      return {
        id: `session-${counter}`,
        userId: 'user-1',
        date: '2026-05-19',
        startedAt: '2026-05-19T10:00:00.000Z',
        finishedAt: null,
        templateType: 'push',
        note: null,
        createdAt: '2026-05-19T10:00:00.000Z',
        updatedAt: '2026-05-19T10:00:00.000Z',
        version: 1,
      };
    });

    const payload = { date: '2026-05-19', templateType: 'push' };

    const first = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-1')
      .send(payload);

    const second = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-1')
      .send(payload);

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.deepEqual(second.body, first.body);
    assert.equal(getCreateCalls(), 1);
  });

  it('executes again when idempotency key differs', async () => {
    let counter = 0;
    const { app, getCreateCalls } = buildTestApp(async () => {
      counter += 1;
      return {
        id: `session-${counter}`,
        userId: 'user-1',
        date: '2026-05-19',
        startedAt: '2026-05-19T10:00:00.000Z',
        finishedAt: null,
        templateType: 'push',
        note: null,
        createdAt: '2026-05-19T10:00:00.000Z',
        updatedAt: '2026-05-19T10:00:00.000Z',
        version: 1,
      };
    });

    const payload = { date: '2026-05-19', templateType: 'push' };

    const first = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-1')
      .send(payload);

    const second = await request(app)
      .post('/training/sessions')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-2')
      .send(payload);

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.notEqual(second.body.session.id, first.body.session.id);
    assert.equal(getCreateCalls(), 2);
  });

  it('replays PUT /sessions/{id} when x-idempotency-key matches', async () => {
    const { app, getUpdateCalls } = buildTestApp(
      undefined,
      async (userId: string, sessionId: string, input: unknown) => {
        return {
          id: sessionId,
          userId,
          date: '2026-05-20',
          startedAt: '2026-05-20T10:00:00.000Z',
          finishedAt: null,
          templateType: 'pull',
          note: 'Updated',
          createdAt: '2026-05-19T10:00:00.000Z',
          updatedAt: '2026-05-20T10:00:00.000Z',
          version: 2,
        };
      },
    );

    const payload = { date: '2026-05-20', templateType: 'pull', note: 'Updated' };

    const first = await request(app)
      .put('/training/sessions/session-1')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-put-1')
      .send(payload);

    const second = await request(app)
      .put('/training/sessions/session-1')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-put-1')
      .send(payload);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.deepEqual(second.body.session, first.body.session);
    assert.equal(getUpdateCalls(), 1);
  });

  it('replays DELETE /sessions/{id} when x-idempotency-key matches', async () => {
    const { app, getDeleteCalls } = buildTestApp(
      undefined,
      undefined,
      async () => true,
    );

    const first = await request(app)
      .delete('/training/sessions/session-1')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-del-1');

    const second = await request(app)
      .delete('/training/sessions/session-1')
      .set('Authorization', bearer())
      .set('x-idempotency-key', 'idem-del-1');

    assert.equal(first.status, 204);
    assert.equal(second.status, 204);
    assert.equal(getDeleteCalls(), 1);
  });
});
