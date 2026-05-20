import { v4 as uuidv4 } from 'uuid';
import { IIdempotencyRecordRepository } from '../../infrastructure/repositories/idempotency-record.repository.interface';
import { IdempotencyRecord } from '../../domain/idempotency-record.entity';

interface SaveInput {
  userId: string;
  key: string;
  method: string;
  requestPath: string;
  statusCode: number;
  responseBody: unknown;
}

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

export class IdempotencyService {
  constructor(private readonly records: IIdempotencyRecordRepository) {}

  async findReplay(
    userId: string,
    key: string,
    method: string,
    requestPath: string,
  ): Promise<IdempotencyRecord | null> {
    return this.records.findByRequest(userId, key, method, requestPath);
  }

  async saveReplay(input: SaveInput): Promise<IdempotencyRecord> {
    const existing = await this.records.findByRequest(
      input.userId,
      input.key,
      input.method,
      input.requestPath,
    );

    const record: IdempotencyRecord = existing
      ? {
          ...existing,
          statusCode: input.statusCode,
          responseBody: input.responseBody,
          updatedAt: now(),
          version: existing.version + 1,
        }
      : {
          ...baseEntity(),
          userId: input.userId,
          key: input.key,
          method: input.method,
          requestPath: input.requestPath,
          statusCode: input.statusCode,
          responseBody: input.responseBody,
        };

    return this.records.save(record);
  }
}
