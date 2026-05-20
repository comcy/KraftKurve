import { BaseEntity } from './base.model';

export interface TrainingSet extends BaseEntity {
  trainingExerciseId: string;
  order: number;
  reps: number;
  weightKg: number;
  /** Duration in seconds; used for cardio/timed exercises. */
  durationSeconds: number | null;
}
