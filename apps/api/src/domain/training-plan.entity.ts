import { BaseEntity } from './base.entity';

export interface TrainingPlan extends BaseEntity {
  userId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  note: string | null;
  active: boolean;
}
