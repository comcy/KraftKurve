import { TrainingSettings } from '../../domain/training-settings.entity';
import { ITrainingSettingsRepository } from '../repositories/training-settings.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonTrainingSettingsRepository
  extends NdjsonRepository<TrainingSettings>
  implements ITrainingSettingsRepository
{
  async findByUserId(userId: string): Promise<TrainingSettings | null> {
    const all = await this.findWhere((e) => e.userId === userId);
    return all[0] || null;
  }
}
