import { BaseEntity } from '../models/base.model';

/**
 * Generic repository contract.
 * Implementations can be NDJSON, IndexedDB, PostgreSQL, etc.
 * T must extend BaseEntity to guarantee id, timestamps, version.
 */
export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  findWhere(predicate: (entity: T) => boolean): Promise<T[]>;
  save(entity: T): Promise<T>;
  saveMany(entities: T[]): Promise<T[]>;
  deleteById(id: string): Promise<void>;
}
