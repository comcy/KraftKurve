import { TrainingPlan } from '../../domain/training-plan.entity';
import { ITrainingPlanRepository } from '../repositories/training-plan.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonTrainingPlanRepository
  extends NdjsonRepository<TrainingPlan>
  implements ITrainingPlanRepository
{
  async findByUserId(userId: string): Promise<TrainingPlan[]> {
    return this.findWhere((e) => e.userId === userId);
  }
}
