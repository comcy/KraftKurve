import { BaseEntity } from './base.entity';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface NutritionEntry extends BaseEntity {
  userId: string;
  date: string; // YYYY-MM-DD
  name: string;
  mealType: MealType;
  portionG: number;
  proteinG: number;
  note: string | null;
}
