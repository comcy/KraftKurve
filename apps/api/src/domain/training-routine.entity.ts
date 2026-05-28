import { BaseEntity } from './base.entity';
import { MuscleGroup } from './training-exercise.entity';

export interface TrainingRoutine extends BaseEntity {
  planId: string;
  name: string;
  order: number;
}

export interface TrainingRoutineExercise extends BaseEntity {
  routineId: string;
  exerciseId: string; // ID from global Exercise catalog
  exerciseName: string;
  muscleGroup: MuscleGroup;
  order: number;
  suggestedSets: number;
}
