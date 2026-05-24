import { Exercise } from '../../domain/exercise.entity';
import { IExerciseRepository } from '../repositories/exercise.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonExerciseRepository
  extends NdjsonRepository<Exercise>
  implements IExerciseRepository
{
  async findAll(): Promise<Exercise[]> {
    return this.readAll();
  }

  async findByName(name: string): Promise<Exercise | null> {
    const all = await this.readAll();
    return all.find((e) => e.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
}
