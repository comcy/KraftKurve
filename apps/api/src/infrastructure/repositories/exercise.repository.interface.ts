import { Exercise } from '../../domain/exercise.entity';

export interface IExerciseRepository {
  findAll(): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  findByName(name: string): Promise<Exercise | null>;
  save(exercise: Exercise): Promise<Exercise>;
  deleteById(id: string): Promise<void>;
}
