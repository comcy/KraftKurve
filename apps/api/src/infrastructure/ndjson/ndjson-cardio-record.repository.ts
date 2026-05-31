import { CardioRecord } from '../../domain/cardio-record.entity';
import { ICardioRecordRepository } from '../repositories/cardio-record.repository.interface';
import { NdjsonRepository } from './ndjson.repository';

export class NdjsonCardioRecordRepository
  extends NdjsonRepository<CardioRecord>
  implements ICardioRecordRepository
{
  async findByTrainingExerciseId(trainingExerciseId: string): Promise<CardioRecord | null> {
    const all = await this.findWhere((e) => e.trainingExerciseId === trainingExerciseId);
    return all[0] || null;
  }
}
