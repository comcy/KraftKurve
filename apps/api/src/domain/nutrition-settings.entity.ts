import { BaseEntity } from './base.entity';

export interface NutritionSettings extends BaseEntity {
  userId: string;
  proteinGoalGrams: number | null;
  proteinPresets: number[];
}
