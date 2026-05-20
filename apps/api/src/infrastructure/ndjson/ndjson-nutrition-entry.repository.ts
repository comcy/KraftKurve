import { NutritionEntry } from '../../domain/nutrition-entry.entity';
import { INutritionEntryRepository } from '../repositories/nutrition-entry.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonNutritionEntryRepository
  extends NdjsonRepository<NutritionEntry>
  implements INutritionEntryRepository
{
  async findByUserAndDate(userId: string, date: string): Promise<NutritionEntry[]> {
    return this.findWhere((e) => e.userId === userId && e.date === date);
  }
}
