import { BaseEntity } from './base.entity';

/** User-scoped favorites catalog for quick food lookup. */
export interface FoodItem extends BaseEntity {
  userId: string;
  name: string;
  proteinPer100g: number;
  defaultPortionG: number;
}
