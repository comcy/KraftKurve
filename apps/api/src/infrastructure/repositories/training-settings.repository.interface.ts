import { TrainingSettings } from '../../domain/training-settings.entity';
import { IRepository } from './repository.interface';

export interface ITrainingSettingsRepository extends IRepository<TrainingSettings> {
  findByUserId(userId: string): Promise<TrainingSettings | null>;
}
