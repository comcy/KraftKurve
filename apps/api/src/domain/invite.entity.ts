import { BaseEntity } from './base.entity';

export type InviteStatus = 'pending' | 'used' | 'revoked';

export interface Invite extends BaseEntity {
  code: string;
  createdByUserId: string;
  usedByUserId: string | null;
  usedAt: string | null;
  status: InviteStatus;
  expiresAt: string | null;
}
