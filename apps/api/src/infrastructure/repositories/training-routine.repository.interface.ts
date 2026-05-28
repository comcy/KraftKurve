import { TrainingRoutine, TrainingRoutineExercise } from '../../domain/training-routine.entity';
import { IRepository } from './repository.interface';

export interface ITrainingRoutineRepository extends IRepository<TrainingRoutine> {
  findByPlanId(planId: string): Promise<TrainingRoutine[]>;
}

export interface ITrainingRoutineExerciseRepository extends IRepository<TrainingRoutineExercise> {
  findByRoutineId(routineId: string): Promise<TrainingRoutineExercise[]>;
}
