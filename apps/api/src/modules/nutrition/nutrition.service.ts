import { v4 as uuidv4 } from 'uuid';
import { NutritionEntry, MealType } from '../../domain/nutrition-entry.entity';
import { FoodItem } from '../../domain/food-item.entity';
import { INutritionEntryRepository } from '../../infrastructure/repositories/nutrition-entry.repository.interface';
import { IFoodItemRepository } from '../../infrastructure/repositories/food-item.repository.interface';
import { IUserRepository } from '../../infrastructure/repositories/user.repository.interface';

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

export interface ProteinGoalSettings {
  proteinGoalG: number | null;
}

export class NutritionService {
  constructor(
    private readonly entries: INutritionEntryRepository,
    private readonly foodItems: IFoodItemRepository,
    private readonly users: IUserRepository,
  ) {}

  async getDaySummary(userId: string, date: string): Promise<DaySummary> {
    const [entriesForDay, user] = await Promise.all([
      this.entries.findByUserAndDate(userId, date),
      this.users.findById(userId),
    ]);
    const totalProteinG = entriesForDay.reduce((sum, e) => sum + e.proteinG, 0);
    return {
      date,
      proteinGoalG: user?.proteinGoalGrams ?? null,
      totalProteinG,
      entries: entriesForDay.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  }

  async getProteinGoal(userId: string): Promise<ProteinGoalSettings> {
    const user = await this.users.findById(userId);
    return { proteinGoalG: user?.proteinGoalGrams ?? null };
  }

  async setProteinGoal(userId: string, proteinGoalG: number | null): Promise<ProteinGoalSettings> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.users.save({
      ...user,
      proteinGoalGrams: proteinGoalG,
      updatedAt: now(),
      version: user.version + 1,
    });

    return { proteinGoalG };
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
}
