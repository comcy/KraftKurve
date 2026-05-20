import { BaseEntity } from './base.entity';

export interface IdempotencyRecord extends BaseEntity {
  userId: string;
  key: string;
  method: string;
  requestPath: string;
  statusCode: number;
  responseBody: unknown;
}
