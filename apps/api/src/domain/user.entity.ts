import { BaseEntity } from './base.entity';

export type UserRole = 'admin' | 'user';

export interface User extends BaseEntity {
  email: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  isActive: boolean;
  proteinGoalGrams: number | null;
}

export type UserPublic = Omit<User, 'passwordHash'>;
