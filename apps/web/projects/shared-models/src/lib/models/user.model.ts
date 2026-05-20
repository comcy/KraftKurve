import { BaseEntity } from './base.model';

export type UserRole = 'admin' | 'user';

export interface User extends BaseEntity {
  email: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  isActive: boolean;
  proteinGoalGrams: number | null;
}

/** Subset safe to return to clients (no passwordHash). */
export type UserPublic = Omit<User, 'passwordHash'>;
