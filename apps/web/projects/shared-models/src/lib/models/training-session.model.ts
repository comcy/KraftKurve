import { BaseEntity } from './base.model';

export type WorkoutTemplate = 'push' | 'pull' | 'legs' | 'full-body' | 'custom';

export interface TrainingSession extends BaseEntity {
  userId: string;
  date: string;           // ISO 8601 date (YYYY-MM-DD)
  startedAt: string;      // ISO 8601 datetime
  finishedAt: string | null;
  templateType: WorkoutTemplate;
  note: string | null;
}
