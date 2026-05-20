import { BaseEntity } from './base.model';

export interface NutritionDay extends BaseEntity {
  userId: string;
  date: string;            // YYYY-MM-DD
  proteinGoalGrams: number; // snapshot of goal at the time
  totalProteinGrams: number; // sum, denormalised for quick reads
}
