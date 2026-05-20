import { BaseEntity } from './base.model';

export type InviteStatus = 'pending' | 'used' | 'revoked';

export interface Invite extends BaseEntity {
  code: string;           // unique random token
  createdByUserId: string;
  usedByUserId: string | null;
  usedAt: string | null;  // ISO 8601
  status: InviteStatus;
  expiresAt: string | null; // ISO 8601
}
