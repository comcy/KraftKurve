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
  | 'full-body'
  | 'cardio';

export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance';

import { BaseEntity } from './base.model';

export interface Exercise extends BaseEntity {
  name: string;
  muscleGroups: MuscleGroup[];
  goals: TrainingGoal[];
  equipmentType: string | null;
  description: string | null;
  /** null = global/admin-defined; userId = user-defined custom exercise */
  ownerId: string | null;
}
