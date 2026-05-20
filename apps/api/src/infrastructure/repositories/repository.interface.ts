import { BaseEntity } from '../../domain/base.entity';

/**
 * Generic repository interface.
 * All persistence adapters (NDJSON, PostgreSQL, SQLite, …)
 * must implement this to remain swappable.
 */
export interface IRepository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  findWhere(predicate: (entity: T) => boolean): Promise<T[]>;
  save(entity: T): Promise<T>;
  saveMany(entities: T[]): Promise<T[]>;
  deleteById(id: string): Promise<void>;
}
