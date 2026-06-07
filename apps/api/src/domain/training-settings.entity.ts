import { BaseEntity } from './base.entity';

export type OverloadStrategy = 'weight-focused' | 'rep-focused';

export interface TrainingSettings extends BaseEntity {
  userId: string;
  overloadStrategy: OverloadStrategy;
  virtualTrainerEnabled: boolean;
}
