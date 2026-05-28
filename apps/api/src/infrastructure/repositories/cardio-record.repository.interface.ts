import { CardioRecord } from '../../domain/cardio-record.entity';
import { IRepository } from './repository.interface';

export interface ICardioRecordRepository extends IRepository<CardioRecord> {
  findByTrainingExerciseId(trainingExerciseId: string): Promise<CardioRecord | null>;
}
