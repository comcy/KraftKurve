import { User } from '../../domain/user.entity';
import { IUserRepository } from '../repositories/user.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonUserRepository
  extends NdjsonRepository<User>
  implements IUserRepository
{
  async findByEmail(email: string): Promise<User | null> {
    const all = await this.readAll();
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async findAllActive(): Promise<User[]> {
    return this.findWhere((u) => u.isActive);
  }
}
