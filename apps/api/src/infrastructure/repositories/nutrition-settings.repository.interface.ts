import { IRepository } from './repository.interface';
import { NutritionSettings } from '../../domain/nutrition-settings.entity';

export interface INutritionSettingsRepository extends IRepository<NutritionSettings> {
  findByUserId(userId: string): Promise<NutritionSettings | null>;
}
