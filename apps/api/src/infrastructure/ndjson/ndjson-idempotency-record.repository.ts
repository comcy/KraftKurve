import { IdempotencyRecord } from '../../domain/idempotency-record.entity';
import { IIdempotencyRecordRepository } from '../repositories/idempotency-record.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonIdempotencyRecordRepository
  extends NdjsonRepository<IdempotencyRecord>
  implements IIdempotencyRecordRepository
{
  async findByRequest(
    userId: string,
    key: string,
    method: string,
    requestPath: string,
  ): Promise<IdempotencyRecord | null> {
    const hits = await this.findWhere(
      (record) =>
        record.userId === userId &&
        record.key === key &&
        record.method === method &&
        record.requestPath === requestPath,
    );
    return hits.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }
}
