import { TrainingExercise } from '../../domain/training-exercise.entity';
import { ITrainingExerciseRepository } from '../repositories/training-exercise.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonTrainingExerciseRepository
  extends NdjsonRepository<TrainingExercise>
  implements ITrainingExerciseRepository
{
  async findBySession(sessionId: string): Promise<TrainingExercise[]> {
    return this.findWhere((exercise) => exercise.sessionId === sessionId);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    const items = await this.findBySession(sessionId);
    await Promise.all(items.map((item) => this.deleteById(item.id)));
  }
}
