import { v4 as uuidv4 } from 'uuid';
import { NutritionEntry, MealType } from '../../domain/nutrition-entry.entity';
import { FoodItem } from '../../domain/food-item.entity';
import { NutritionSettings as NutritionSettingsEntity } from '../../domain/nutrition-settings.entity';
import { INutritionEntryRepository } from '../../infrastructure/repositories/nutrition-entry.repository.interface';
import { IFoodItemRepository } from '../../infrastructure/repositories/food-item.repository.interface';
import { IUserRepository } from '../../infrastructure/repositories/user.repository.interface';
import { INutritionSettingsRepository } from '../../infrastructure/repositories/nutrition-settings.repository.interface';

function now(): string {
  return new Date().toISOString();
}

function baseEntity(id = uuidv4()) {
  const ts = now();
  return { id, createdAt: ts, updatedAt: ts, version: 1 };
}

export interface DaySummary {
  date: string;
  proteinGoalG: number | null;
  totalProteinG: number;
  entries: NutritionEntry[];
}

export interface CreateEntryInput {
  date: string;
  name: string;
  mealType: MealType;
  portionG: number;
  proteinG: number;
  note?: string | null;
}

export interface UpdateEntryInput {
  name?: string;
  mealType?: MealType;
  portionG?: number;
  proteinG?: number;
  note?: string | null;
}

export interface CreateFoodItemInput {
  name: string;
  proteinPer100g: number;
  defaultPortionG: number;
}

export interface UpdateFoodItemInput {
  name?: string;
  proteinPer100g?: number;
  defaultPortionG?: number;
}

export interface NutritionSettings {
  proteinGoalG: number | null;
  proteinPresets: number[];
}

export class NutritionService {
  constructor(
    private readonly entries: INutritionEntryRepository,
    private readonly foodItems: IFoodItemRepository,
    private readonly users: IUserRepository,
    private readonly nutritionSettings: INutritionSettingsRepository,
  ) {}

  async getDaySummary(userId: string, date: string): Promise<DaySummary> {
    const [entriesForDay, settings] = await Promise.all([
      this.entries.findByUserAndDate(userId, date),
      this.getNutritionSettings(userId),
    ]);
    const totalProteinG = entriesForDay.reduce((sum, e) => sum + e.proteinG, 0);
    return {
      date,
      proteinGoalG: settings.proteinGoalG,
      totalProteinG,
      entries: entriesForDay.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  }

  async getNutritionSettings(userId: string): Promise<NutritionSettings> {
    const settings = await this.nutritionSettings.findByUserId(userId);
    return { 
      proteinGoalG: settings?.proteinGoalGrams ?? null,
      proteinPresets: settings?.proteinPresets ?? [20, 40, 60]
    };
  }

  async setNutritionSettings(
    userId: string, 
    input: { proteinGoalG?: number | null, proteinPresets?: number[] }
  ): Promise<NutritionSettings> {
    const existing = await this.nutritionSettings.findByUserId(userId);
    
    let settings: NutritionSettingsEntity;
    if (existing) {
      settings = {
        ...existing,
        updatedAt: now(),
        version: existing.version + 1,
      };
    } else {
      settings = {
        ...baseEntity(),
        userId,
        proteinGoalGrams: null,
        proteinPresets: [20, 40, 60],
      };
    }

    if (input.proteinGoalG !== undefined) {
      settings.proteinGoalGrams = input.proteinGoalG;
    }
    if (input.proteinPresets !== undefined) {
      settings.proteinPresets = input.proteinPresets;
    }

    const saved = await this.nutritionSettings.save(settings);

    return { 
      proteinGoalG: saved.proteinGoalGrams,
      proteinPresets: saved.proteinPresets
    };
  }

  async createEntry(userId: string, input: CreateEntryInput): Promise<NutritionEntry> {
    const entry: NutritionEntry = {
      ...baseEntity(),
      userId,
      date: input.date,
      name: input.name,
      mealType: input.mealType,
      portionG: input.portionG,
      proteinG: input.proteinG,
      note: input.note ?? null,
    };
    return this.entries.save(entry);
  }

  async updateEntry(
    userId: string,
    entryId: string,
    input: UpdateEntryInput,
  ): Promise<NutritionEntry | null> {
    const existing = await this.entries.findById(entryId);
    if (!existing || existing.userId !== userId) return null;
    const updated: NutritionEntry = {
      ...existing,
      ...input,
      updatedAt: now(),
      version: existing.version + 1,
    };
    return this.entries.save(updated);
  }

  async deleteEntry(userId: string, entryId: string): Promise<boolean> {
    const existing = await this.entries.findById(entryId);
    if (!existing || existing.userId !== userId) return false;
    await this.entries.deleteById(entryId);
    return true;
  }

  async listFoodItems(userId: string): Promise<FoodItem[]> {
    return this.foodItems.findByUser(userId);
  }

  async createFoodItem(userId: string, input: CreateFoodItemInput): Promise<FoodItem> {
    const item: FoodItem = {
      ...baseEntity(),
      userId,
      name: input.name,
      proteinPer100g: input.proteinPer100g,
      defaultPortionG: input.defaultPortionG,
    };
    return this.foodItems.save(item);
  }

  async updateFoodItem(
    userId: string,
    itemId: string,
    input: UpdateFoodItemInput,
  ): Promise<FoodItem | null> {
    const existing = await this.foodItems.findById(itemId);
    if (!existing || existing.userId !== userId) return null;
    const updated: FoodItem = {
      ...existing,
      ...input,
      updatedAt: now(),
      version: existing.version + 1,
    };
    return this.foodItems.save(updated);
  }

  async deleteFoodItem(userId: string, itemId: string): Promise<boolean> {
    const existing = await this.foodItems.findById(itemId);
    if (!existing || existing.userId !== userId) return false;
    await this.foodItems.deleteById(itemId);
    return true;
  }

  async getHistory(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ entries: NutritionEntry[]; total: number }> {
    return this.entries.findByUserPaginated(userId, page, limit);
  }

  async getChartData(
    userId: string,
    period: 'week' | 'month' | 'year',
  ): Promise<{ date: string; value: number }[]> {
    const now = new Date();
    let startDate: string;

    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      startDate = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      startDate = d.toISOString().split('T')[0];
    } else {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      startDate = d.toISOString().split('T')[0];
    }

    const endDate = now.toISOString().split('T')[0];
    const entries = await this.entries.findByUserInRange(userId, startDate, endDate);

    const map = new Map<string, number>();

    if (period === 'year') {
      // Aggregate by month
      entries.forEach((e) => {
        const month = e.date.substring(0, 7); // YYYY-MM
        map.set(month, (map.get(month) || 0) + e.proteinG);
      });
      // Fill missing months
      const result: { date: string; value: number }[] = [];
      const curr = new Date(startDate.substring(0, 7) + '-01');
      const end = new Date(endDate.substring(0, 7) + '-01');
      while (curr <= end) {
        const key = curr.toISOString().substring(0, 7);
        result.push({ date: key, value: map.get(key) || 0 });
        curr.setMonth(curr.getMonth() + 1);
      }
      return result;
    } else {
      // Aggregate by day
      entries.forEach((e) => {
        map.set(e.date, (map.get(e.date) || 0) + e.proteinG);
      });
      // Fill missing days
      const result: { date: string; value: number }[] = [];
      const curr = new Date(startDate);
      const end = new Date(endDate);
      while (curr <= end) {
        const key = curr.toISOString().split('T')[0];
        result.push({ date: key, value: map.get(key) || 0 });
        curr.setDate(curr.getDate() + 1);
      }
      return result;
    }
  }
}
