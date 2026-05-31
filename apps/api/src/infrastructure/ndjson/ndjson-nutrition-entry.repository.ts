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

  async findByUserPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ entries: NutritionEntry[]; total: number }> {
    const all = await this.findWhere((e) => e.userId === userId);
    // Sort descending by date, then createdAt
    all.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });

    const start = (page - 1) * limit;
    const entries = all.slice(start, start + limit);
    return { entries, total: all.length };
  }

  async findByUserInRange(userId: string, startDate: string, endDate: string): Promise<NutritionEntry[]> {
    return this.findWhere((e) => e.userId === userId && e.date >= startDate && e.date <= endDate);
  }
}
