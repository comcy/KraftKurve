import { TrainingExercise } from '../../domain/training-exercise.entity';
import { IRepository } from './repository.interface';

export interface ITrainingExerciseRepository extends IRepository<TrainingExercise> {
  findBySession(sessionId: string): Promise<TrainingExercise[]>;
  deleteBySession(sessionId: string): Promise<void>;
}
