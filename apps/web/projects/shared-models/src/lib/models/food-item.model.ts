import { BaseEntity } from './base.model';

export interface FoodItem extends BaseEntity {
  name: string;
  proteinPer100g: number;
  defaultPortionGrams: number;
  /** null = global; userId = user's private favourite */
  ownerId: string | null;
}
