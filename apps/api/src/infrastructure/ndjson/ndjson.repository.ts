import { promises as fs } from 'fs';
import path from 'path';
import { BaseEntity } from '../../domain/base.entity';
import { IRepository } from '../repositories/repository.interface';

/**
 * Generic NDJSON-based repository.
 * One *.ndjson file per entity type.
 */
export class NdjsonRepository<T extends BaseEntity> implements IRepository<T> {
  private lock: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async withLock<R>(task: () => Promise<R>): Promise<R> {
    const previous = this.lock;
    let resolveLock: () => void;
    this.lock = new Promise((resolve) => {
      resolveLock = resolve;
    });

    try {
      await previous;
      return await task();
    } finally {
      // @ts-ignore - guaranteed to be assigned by Promise constructor
      resolveLock!();
    }
  }

  private async ensureFile(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '', 'utf-8');
    }
  }

  async readAll(): Promise<T[]> {
    return this.withLock(async () => {
      await this.ensureFile();
      const content = await fs.readFile(this.filePath, 'utf-8');
      const lines = content.split('\n');
      const entities: T[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          entities.push(JSON.parse(line) as T);
        } catch (e) {
          console.error(`[NDJSON] Malformed line ${i + 1} in ${this.filePath}. Skipping.`, line);
        }
      }
      return entities;
    });
  }

  protected async writeAll(entities: T[]): Promise<void> {
    return this.withLock(async () => {
      await this.ensureFile();
      const tempPath = `${this.filePath}.tmp`;
      const content = entities.map((e) => JSON.stringify(e)).join('\n') + (entities.length > 0 ? '\n' : '');
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, this.filePath);
    });
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
    return this.withLock(async () => {
      await this.ensureFile();
      const content = await fs.readFile(this.filePath, 'utf-8');
      const all: T[] = content.split('\n')
        .filter(l => l.trim())
        .map(l => {
          try { return JSON.parse(l); } catch { return null; }
        })
        .filter(l => l !== null);

      const idx = all.findIndex((e) => e.id === entity.id);
      if (idx >= 0) {
        all[idx] = entity;
      } else {
        all.push(entity);
      }
      
      const tempPath = `${this.filePath}.tmp`;
      const newContent = all.map((e) => JSON.stringify(e)).join('\n') + (all.length > 0 ? '\n' : '');
      await fs.writeFile(tempPath, newContent, 'utf-8');
      await fs.rename(tempPath, this.filePath);
      return entity;
    });
  }

  async saveMany(entities: T[]): Promise<T[]> {
    return this.withLock(async () => {
      await this.ensureFile();
      const content = await fs.readFile(this.filePath, 'utf-8');
      const all: T[] = content.split('\n')
        .filter(l => l.trim())
        .map(l => {
          try { return JSON.parse(l); } catch { return null; }
        })
        .filter(l => l !== null);

      for (const entity of entities) {
        const idx = all.findIndex((e) => e.id === entity.id);
        if (idx >= 0) {
          all[idx] = entity;
        } else {
          all.push(entity);
        }
      }
      
      const tempPath = `${this.filePath}.tmp`;
      const newContent = all.map((e) => JSON.stringify(e)).join('\n') + (all.length > 0 ? '\n' : '');
      await fs.writeFile(tempPath, newContent, 'utf-8');
      await fs.rename(tempPath, this.filePath);
      return entities;
    });
  }

  async deleteById(id: string): Promise<void> {
    return this.withLock(async () => {
      await this.ensureFile();
      const content = await fs.readFile(this.filePath, 'utf-8');
      const all: T[] = content.split('\n')
        .filter(l => l.trim())
        .map(l => {
          try { return JSON.parse(l); } catch { return null; }
        })
        .filter(l => l !== null);

      const filtered = all.filter((e) => e.id !== id);
      
      const tempPath = `${this.filePath}.tmp`;
      const newContent = filtered.map((e) => JSON.stringify(e)).join('\n') + (filtered.length > 0 ? '\n' : '');
      await fs.writeFile(tempPath, newContent, 'utf-8');
      await fs.rename(tempPath, this.filePath);
    });
  }
}
