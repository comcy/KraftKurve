import { BaseEntity } from './base.entity';

export type WorkoutTemplate = 'push' | 'pull' | 'legs' | 'full-body' | 'custom';

export interface TrainingSession extends BaseEntity {
  userId: string;
  planId: string | null;     // Linked to TrainingPlan
  routineId: string | null;  // Linked to TrainingRoutine
  date: string; // YYYY-MM-DD
  startedAt: string;
  finishedAt: string | null;
  totalSeconds: number;
  isPaused: boolean;
  templateType: WorkoutTemplate;
  note: string | null;
}
