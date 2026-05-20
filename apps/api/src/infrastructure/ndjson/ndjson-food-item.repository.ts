import { FoodItem } from '../../domain/food-item.entity';
import { IFoodItemRepository } from '../repositories/food-item.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonFoodItemRepository
  extends NdjsonRepository<FoodItem>
  implements IFoodItemRepository
{
  async findByUser(userId: string): Promise<FoodItem[]> {
    return this.findWhere((item) => item.userId === userId);
  }
}
