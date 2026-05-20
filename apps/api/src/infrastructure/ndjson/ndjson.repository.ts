import { promises as fs } from 'fs';
import path from 'path';
import { BaseEntity } from '../../domain/base.entity';
import { IRepository } from '../repositories/repository.interface';

/**
 * Generic NDJSON-based repository.
 * One *.ndjson file per entity type.
 * Each line is a JSON-serialised entity (record).
 *
 * Swappable: replace with NdjsonRepository for other adapters
 * that implement IRepository<T> without touching business logic.
 */
export class NdjsonRepository<T extends BaseEntity> implements IRepository<T> {
  constructor(private readonly filePath: string) {}

  private async ensureFile(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '', 'utf-8');
    }
  }

  protected async readAll(): Promise<T[]> {
    await this.ensureFile();
    const content = await fs.readFile(this.filePath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as T);
  }

  private async writeAll(entities: T[]): Promise<void> {
    await this.ensureFile();
    const content = entities.map((e) => JSON.stringify(e)).join('\n');
    await fs.writeFile(this.filePath, content ? content + '\n' : '', 'utf-8');
  }

  async findById(id: string): Promise<T | null> {
    const all = await this.readAll();
    return all.find((e) => e.id === id) ?? null;
  }

  async findAll(): Promise<T[]> {
    return this.readAll();
  }

  async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    const all = await this.readAll();
    return all.filter(predicate);
  }

  async save(entity: T): Promise<T> {
    const all = await this.readAll();
    const idx = all.findIndex((e) => e.id === entity.id);
    if (idx >= 0) {
      all[idx] = entity;
    } else {
      all.push(entity);
    }
    await this.writeAll(all);
    return entity;
  }

  async saveMany(entities: T[]): Promise<T[]> {
    const all = await this.readAll();
    for (const entity of entities) {
      const idx = all.findIndex((e) => e.id === entity.id);
      if (idx >= 0) {
        all[idx] = entity;
      } else {
        all.push(entity);
      }
    }
    await this.writeAll(all);
    return entities;
  }

  async deleteById(id: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((e) => e.id !== id));
  }
}
