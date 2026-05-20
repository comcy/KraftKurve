import { BaseEntity } from './base.model';

export interface NutritionEntry extends BaseEntity {
  nutritionDayId: string;
  foodItemId: string | null; // null when custom entry
  name: string;              // copied name at log time
  portionGrams: number;
  proteinGrams: number;
  loggedAt: string;          // ISO 8601 datetime
}
