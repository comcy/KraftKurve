import { User } from '../../domain/user.entity';
import { IRepository } from './repository.interface';

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findAllActive(): Promise<User[]>;
}
