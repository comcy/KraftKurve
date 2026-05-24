import path from 'path';
import { NdjsonUserRepository } from './infrastructure/ndjson/ndjson-user.repository';
import { NdjsonInviteRepository } from './infrastructure/ndjson/ndjson-invite.repository';
import { NdjsonTrainingSessionRepository } from './infrastructure/ndjson/ndjson-training-session.repository';
import { NdjsonTrainingExerciseRepository } from './infrastructure/ndjson/ndjson-training-exercise.repository';
import { NdjsonTrainingSetRepository } from './infrastructure/ndjson/ndjson-training-set.repository';
import { NdjsonTrainingPlanTemplateRepository } from './infrastructure/ndjson/ndjson-training-plan-template.repository';
import { NdjsonIdempotencyRecordRepository } from './infrastructure/ndjson/ndjson-idempotency-record.repository';
import { NdjsonNutritionEntryRepository } from './infrastructure/ndjson/ndjson-nutrition-entry.repository';
import { NdjsonFoodItemRepository } from './infrastructure/ndjson/ndjson-food-item.repository';
import { NdjsonExerciseRepository } from './infrastructure/ndjson/ndjson-exercise.repository';
import { NdjsonNutritionSettingsRepository } from './infrastructure/ndjson/ndjson-nutrition-settings.repository';

import { IUserRepository } from './infrastructure/repositories/user.repository.interface';
import { IInviteRepository } from './infrastructure/repositories/invite.repository.interface';
import { ITrainingSessionRepository } from './infrastructure/repositories/training-session.repository.interface';
import { ITrainingExerciseRepository } from './infrastructure/repositories/training-exercise.repository.interface';
import { ITrainingSetRepository } from './infrastructure/repositories/training-set.repository.interface';
import { ITrainingPlanTemplateRepository } from './infrastructure/repositories/training-plan-template.repository.interface';
import { IIdempotencyRecordRepository } from './infrastructure/repositories/idempotency-record.repository.interface';
import { INutritionEntryRepository } from './infrastructure/repositories/nutrition-entry.repository.interface';
import { IFoodItemRepository } from './infrastructure/repositories/food-item.repository.interface';
import { IExerciseRepository } from './infrastructure/repositories/exercise.repository.interface';
import { INutritionSettingsRepository } from './infrastructure/repositories/nutrition-settings.repository.interface';

const DATA_DIR = process.env['DATA_DIR'] ?? path.join(process.cwd(), 'data');

/** All active repository instances (NDJSON adapter). */
export const userRepository: IUserRepository = new NdjsonUserRepository(
  path.join(DATA_DIR, 'users.ndjson'),
);

export const inviteRepository: IInviteRepository = new NdjsonInviteRepository(
  path.join(DATA_DIR, 'invites.ndjson'),
);

export const trainingSessionRepository: ITrainingSessionRepository =
  new NdjsonTrainingSessionRepository(path.join(DATA_DIR, 'training-sessions.ndjson'));

export const trainingExerciseRepository: ITrainingExerciseRepository =
  new NdjsonTrainingExerciseRepository(path.join(DATA_DIR, 'training-exercises.ndjson'));

export const trainingSetRepository: ITrainingSetRepository =
  new NdjsonTrainingSetRepository(path.join(DATA_DIR, 'training-sets.ndjson'));

export const trainingPlanTemplateRepository: ITrainingPlanTemplateRepository =
  new NdjsonTrainingPlanTemplateRepository(path.join(DATA_DIR, 'training-plan-templates.ndjson'));

export const idempotencyRecordRepository: IIdempotencyRecordRepository =
  new NdjsonIdempotencyRecordRepository(path.join(DATA_DIR, 'idempotency-records.ndjson'));

export const nutritionEntryRepository: INutritionEntryRepository =
  new NdjsonNutritionEntryRepository(path.join(DATA_DIR, 'nutrition-entries.ndjson'));

export const foodItemRepository: IFoodItemRepository =
  new NdjsonFoodItemRepository(path.join(DATA_DIR, 'food-items.ndjson'));

export const exerciseRepository: IExerciseRepository =
  new NdjsonExerciseRepository(path.join(DATA_DIR, 'exercises.ndjson'));

export const nutritionSettingsRepository: INutritionSettingsRepository =
  new NdjsonNutritionSettingsRepository(path.join(DATA_DIR, 'nutrition-settings.ndjson'));
