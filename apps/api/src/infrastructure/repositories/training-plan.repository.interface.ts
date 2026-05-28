import { TrainingPlan } from '../../domain/training-plan.entity';
import { IRepository } from './repository.interface';

export interface ITrainingPlanRepository extends IRepository<TrainingPlan> {
  findByUserId(userId: string): Promise<TrainingPlan[]>;
}
