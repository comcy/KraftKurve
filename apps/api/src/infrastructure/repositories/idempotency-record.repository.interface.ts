import { IdempotencyRecord } from '../../domain/idempotency-record.entity';
import { IRepository } from './repository.interface';

export interface IIdempotencyRecordRepository extends IRepository<IdempotencyRecord> {
  findByRequest(
    userId: string,
    key: string,
    method: string,
    requestPath: string,
  ): Promise<IdempotencyRecord | null>;
}
