import { TrainingSet } from '../../domain/training-set.entity';
import { IRepository } from './repository.interface';

export interface ITrainingSetRepository extends IRepository<TrainingSet> {
  findByExercise(trainingExerciseId: string): Promise<TrainingSet[]>;
  deleteByExercise(trainingExerciseId: string): Promise<void>;
}
