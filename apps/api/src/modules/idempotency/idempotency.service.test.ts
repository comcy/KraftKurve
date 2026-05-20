import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IdempotencyRecord } from '../../domain/idempotency-record.entity';
import { IIdempotencyRecordRepository } from '../../infrastructure/repositories/idempotency-record.repository.interface';
import { IdempotencyService } from './idempotency.service';

class MemoryIdempotencyRepository implements IIdempotencyRecordRepository {
  private readonly records: IdempotencyRecord[] = [];

  async findByRequest(
    userId: string,
    key: string,
    method: string,
    requestPath: string,
  ): Promise<IdempotencyRecord | null> {
    const hits = this.records.filter(
      (record) =>
        record.userId === userId &&
        record.key === key &&
        record.method === method &&
        record.requestPath === requestPath,
    );
    return hits.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
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

describe('IdempotencyService', () => {
  it('saves and replays previous response for same request key tuple', async () => {
    const repo = new MemoryIdempotencyRepository();
    const service = new IdempotencyService(repo);

    await service.saveReplay({
      userId: 'user-1',
      key: 'key-1',
      method: 'POST',
      requestPath: '/training/sessions',
      statusCode: 201,
      responseBody: { session: { id: 'session-1' } },
    });

    const replay = await service.findReplay('user-1', 'key-1', 'POST', '/training/sessions');
    assert.ok(replay);
    assert.equal(replay.statusCode, 201);
    assert.deepEqual(replay.responseBody, { session: { id: 'session-1' } });
  });

  it('updates existing replay entry for same request key tuple', async () => {
    const repo = new MemoryIdempotencyRepository();
    const service = new IdempotencyService(repo);

    const first = await service.saveReplay({
      userId: 'user-1',
      key: 'key-1',
      method: 'POST',
      requestPath: '/training/sessions',
      statusCode: 201,
      responseBody: { session: { id: 'session-1' } },
    });

    const second = await service.saveReplay({
      userId: 'user-1',
      key: 'key-1',
      method: 'POST',
      requestPath: '/training/sessions',
      statusCode: 201,
      responseBody: { session: { id: 'session-2' } },
    });

    assert.equal(second.id, first.id);
    assert.equal(second.version, first.version + 1);

    const replay = await service.findReplay('user-1', 'key-1', 'POST', '/training/sessions');
    assert.ok(replay);
    assert.deepEqual(replay.responseBody, { session: { id: 'session-2' } });
  });
});
