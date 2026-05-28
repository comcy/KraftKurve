import { BaseEntity } from './base.entity';

export interface CardioRecord extends BaseEntity {
  trainingExerciseId: string;
  durationSeconds: number;
  distanceMeters: number | null;
  caloriesBurned: number | null;
  heartRateAverage: number | null;
  note: string | null;
}
