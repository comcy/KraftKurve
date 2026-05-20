import { TrainingPlanTemplate } from '../../domain/training-plan-template.entity';
import { IRepository } from './repository.interface';

export interface ITrainingPlanTemplateRepository extends IRepository<TrainingPlanTemplate> {
  findByUser(userId: string): Promise<TrainingPlanTemplate[]>;
}
