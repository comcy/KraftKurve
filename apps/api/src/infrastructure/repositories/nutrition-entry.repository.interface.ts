import { NutritionEntry } from '../../domain/nutrition-entry.entity';
import { IRepository } from './repository.interface';

export interface INutritionEntryRepository extends IRepository<NutritionEntry> {
  findByUserAndDate(userId: string, date: string): Promise<NutritionEntry[]>;
}
