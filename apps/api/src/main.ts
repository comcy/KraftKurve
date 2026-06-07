import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomBytes } from 'crypto';
import {
  userRepository,
  inviteRepository,
  trainingSessionRepository,
  trainingExerciseRepository,
  trainingSetRepository,
  trainingPlanRepository,
  trainingRoutineRepository,
  trainingRoutineExerciseRepository,
  cardioRecordRepository,
  trainingSettingsRepository,
  exerciseRepository,
  idempotencyRecordRepository,
  nutritionEntryRepository,
  foodItemRepository,
  nutritionSettingsRepository,
} from './container';
import { AuthService } from './modules/auth/auth.service';
import { createAuthRouter } from './modules/auth/auth.routes';
import { TrainingService } from './modules/training/training.service';
import { createTrainingRouter } from './modules/training/training.routes';
import { IdempotencyService } from './modules/idempotency/idempotency.service';
import { NutritionService } from './modules/nutrition/nutrition.service';
import { createNutritionRouter } from './modules/nutrition/nutrition.routes';

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Request Logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Wire services
const authService = new AuthService(userRepository, inviteRepository);
const trainingService = new TrainingService(
  trainingSessionRepository,
  trainingExerciseRepository,
  trainingSetRepository,
  trainingPlanRepository,
  trainingRoutineRepository,
  trainingRoutineExerciseRepository,
  cardioRecordRepository,
  trainingSettingsRepository,
  exerciseRepository,
);
const idempotencyService = new IdempotencyService(idempotencyRecordRepository);
const nutritionService = new NutritionService(
  nutritionEntryRepository,
  foodItemRepository,
  userRepository,
  nutritionSettingsRepository,
);

// Routes
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});
app.use('/auth', createAuthRouter(authService));
app.use('/training', createTrainingRouter(trainingService, idempotencyService));
app.use('/nutrition', createNutritionRouter(nutritionService, idempotencyService));

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Global Error Handler]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    stack: process.env['NODE_ENV'] === 'development' ? err.stack : undefined,
  });
});

function generateAdminPassword(): string {
  // 18 chars with mixed classes to be strong but terminal-safe.
  const raw = randomBytes(18).toString('base64url');
  return `Aa1!${raw}`;
}

async function bootstrapAdminIfMissing(): Promise<void> {
  const email = process.env['DEFAULT_ADMIN_EMAIL'] ?? 'admin@kraftkurve.local';
  const envPassword = process.env['DEFAULT_ADMIN_PASSWORD'];
  const password = envPassword || generateAdminPassword();
  const { created, user } = await authService.ensureAdminExists(email, password);

  if (created) {
    console.log('');
    console.log('=== KraftKurve Admin Bootstrap ===');
    console.log(`Admin email: ${email}`);
    if (envPassword) {
      console.log(`Admin password: [SET VIA ENVIRONMENT]`);
    } else {
      console.log(`Admin password: ${password}`);
    }
    console.log('Please log in and change the password immediately.');
    console.log('==================================');
    console.log('');
  } else {
    console.log(`[Auth] Admin already exists (${user.email}), auto-bootstrap skipped.`);
  }
}

const port = Number(process.env['PORT'] ?? 3000);

async function start(): Promise<void> {
  await bootstrapAdminIfMissing();
  app.listen(port, () => {
    console.log(`KraftKurve API listening on http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
