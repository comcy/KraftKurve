import { TrainingSession } from '../../domain/training-session.entity';
import { ITrainingSessionRepository } from '../repositories/training-session.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonTrainingSessionRepository
  extends NdjsonRepository<TrainingSession>
  implements ITrainingSessionRepository
{
  async findByUser(userId: string): Promise<TrainingSession[]> {
    return this.findWhere((session) => session.userId === userId);
  }
}
