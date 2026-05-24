import { NdjsonRepository } from './ndjson.repository';
import { NutritionSettings } from '../../../domain/nutrition-settings.entity';
import { INutritionSettingsRepository } from '../../repositories/nutrition-settings.repository.interface';

export class NdjsonNutritionSettingsRepository
  extends NdjsonRepository<NutritionSettings>
  implements INutritionSettingsRepository
{
  async findByUserId(userId: string): Promise<NutritionSettings | null> {
    const all = await this.readAll();
    return all.find((s) => s.userId === userId) || null;
  }
}
