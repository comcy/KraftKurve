import { FoodItem } from '../../domain/food-item.entity';
import { IRepository } from './repository.interface';

export interface IFoodItemRepository extends IRepository<FoodItem> {
  findByUser(userId: string): Promise<FoodItem[]>;
}
