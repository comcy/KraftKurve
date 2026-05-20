import { BaseEntity } from './base.entity';

export type WorkoutTemplate = 'push' | 'pull' | 'legs' | 'full-body' | 'custom';

export interface TrainingSession extends BaseEntity {
  userId: string;
  date: string; // YYYY-MM-DD
  startedAt: string;
  finishedAt: string | null;
  templateType: WorkoutTemplate;
  note: string | null;
}
