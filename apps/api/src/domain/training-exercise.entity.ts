import { BaseEntity } from './base.entity';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'legs'
  | 'full-body'
  | 'cardio';

export interface TrainingExercise extends BaseEntity {
  sessionId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  order: number;
  supersetGroupId: string | null;
  note: string | null;
}
