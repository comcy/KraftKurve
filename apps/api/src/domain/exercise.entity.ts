import { BaseEntity } from './base.entity';
import { MuscleGroup } from './training-exercise.entity';

export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'other';
export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'other';

export interface Exercise extends BaseEntity {
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup;
  equipmentType?: EquipmentType;
}
