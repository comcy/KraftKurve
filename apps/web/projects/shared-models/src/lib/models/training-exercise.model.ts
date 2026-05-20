import { BaseEntity } from './base.model';

export interface TrainingExercise extends BaseEntity {
  sessionId: string;
  exerciseId: string;
  order: number;
  note: string | null;
}
