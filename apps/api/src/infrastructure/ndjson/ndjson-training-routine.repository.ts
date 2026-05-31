import { TrainingRoutine, TrainingRoutineExercise } from '../../domain/training-routine.entity';
import { ITrainingRoutineRepository, ITrainingRoutineExerciseRepository } from '../repositories/training-routine.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonTrainingRoutineRepository
  extends NdjsonRepository<TrainingRoutine>
  implements ITrainingRoutineRepository
{
  async findByPlanId(planId: string): Promise<TrainingRoutine[]> {
    return this.findWhere((e) => e.planId === planId);
  }
}

export class NdjsonTrainingRoutineExerciseRepository
  extends NdjsonRepository<TrainingRoutineExercise>
  implements ITrainingRoutineExerciseRepository
{
  async findByRoutineId(routineId: string): Promise<TrainingRoutineExercise[]> {
    return this.findWhere((e) => e.routineId === routineId);
  }

  async deleteByRoutine(routineId: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((e) => e.routineId !== routineId));
  }
}
