import { TrainingSet } from '../../domain/training-set.entity';
import { ITrainingSetRepository } from '../repositories/training-set.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonTrainingSetRepository
  extends NdjsonRepository<TrainingSet>
  implements ITrainingSetRepository
{
  async findByExercise(trainingExerciseId: string): Promise<TrainingSet[]> {
    return this.findWhere((set) => set.trainingExerciseId === trainingExerciseId);
  }

  async deleteByExercise(trainingExerciseId: string): Promise<void> {
    const all = await this.readAll();
    const filtered = all.filter((set) => set.trainingExerciseId !== trainingExerciseId);
    await this.writeAll(filtered);
  }
}
