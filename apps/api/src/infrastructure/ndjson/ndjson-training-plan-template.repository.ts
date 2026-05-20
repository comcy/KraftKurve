import { TrainingPlanTemplate } from '../../domain/training-plan-template.entity';
import { ITrainingPlanTemplateRepository } from '../repositories/training-plan-template.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonTrainingPlanTemplateRepository
  extends NdjsonRepository<TrainingPlanTemplate>
  implements ITrainingPlanTemplateRepository
{
  async findByUser(userId: string): Promise<TrainingPlanTemplate[]> {
    return this.findWhere((template) => template.userId === userId);
  }
}
