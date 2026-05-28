import { NutritionEntry } from '../../domain/nutrition-entry.entity';
import { IRepository } from './repository.interface';

export interface INutritionEntryRepository extends IRepository<NutritionEntry> {
  findByUserAndDate(userId: string, date: string): Promise<NutritionEntry[]>;
  findByUserPaginated(userId: string, page: number, limit: number): Promise<{ entries: NutritionEntry[], total: number }>;
  findByUserInRange(userId: string, startDate: string, endDate: string): Promise<NutritionEntry[]>;
}
