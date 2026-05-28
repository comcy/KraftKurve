import { BaseEntity } from './base.entity';

export interface TrainingSet extends BaseEntity {
  trainingExerciseId: string;
  order: number;
  reps: number;
  weightKg: number;
  rir: number | null; // Reps In Reserve
  done: boolean;
}
