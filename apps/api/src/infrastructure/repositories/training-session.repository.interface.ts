import { TrainingSession } from '../../domain/training-session.entity';
import { IRepository } from './repository.interface';

export interface ITrainingSessionRepository extends IRepository<TrainingSession> {
  findByUser(userId: string): Promise<TrainingSession[]>;
}
