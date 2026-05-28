import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest, requireUser as requireAuth } from '../../middleware/auth.middleware';
import { TrainingService } from './training.service';
import { IdempotencyService } from '../idempotency/idempotency.service';

const templateEnum = z.enum(['push', 'pull', 'legs', 'full-body', 'custom']);
const muscleGroupEnum = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'full-body',
  'cardio',
]);

const exerciseCategoryEnum = z.enum(['strength', 'cardio', 'flexibility', 'other']);
const equipmentTypeEnum = z.enum(['barbell', 'dumbbell', 'machine', 'bodyweight', 'cable', 'other']);

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  templateType: templateEnum,
  planId: z.string().uuid().optional().nullable(),
  routineId: z.string().uuid().optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  startedAt: z.string().datetime().optional(),
  finishedAt: z.string().datetime().optional().nullable(),
  totalSeconds: z.number().int().min(0).optional(),
  isPaused: z.boolean().optional(),
});

const updateSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    templateType: templateEnum.optional(),
    planId: z.string().uuid().optional().nullable(),
    routineId: z.string().uuid().optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
    startedAt: z.string().datetime().optional(),
    finishedAt: z.string().datetime().optional().nullable(),
    totalSeconds: z.number().int().min(0).optional(),
    isPaused: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'No fields to update',
  });

const createCardioRecordSchema = z.object({
  durationSeconds: z.number().int().min(1),
  distanceMeters: z.number().min(0).optional().nullable(),
  caloriesBurned: z.number().min(0).optional().nullable(),
  heartRateAverage: z.number().int().min(30).max(250).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

const createPlanSchema = z.object({
  name: z.string().min(1).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(2000).optional().nullable(),
  active: z.boolean().optional(),
}).refine(v => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
  message: 'endDate must be >= startDate',
  path: ['endDate']
});

const createExerciseSchema = z.object({
  exerciseName: z.string().min(1).max(160),
  muscleGroup: muscleGroupEnum,
  note: z.string().max(2000).optional().nullable(),
});

const updateExerciseSchema = z
  .object({
    exerciseName: z.string().min(1).max(160).optional(),
    muscleGroup: muscleGroupEnum.optional(),
    note: z.string().max(2000).optional().nullable(),
    order: z.number().int().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'No fields to update',
  });

const createSetSchema = z.object({
  reps: z.number().int().min(1).max(999),
  weightKg: z.number().min(0).max(9999),
  rir: z.number().int().min(0).max(10).optional().nullable(),
  done: z.boolean().optional(),
});

const updateSetSchema = z
  .object({
    reps: z.number().int().min(1).max(999).optional(),
    weightKg: z.number().min(0).max(9999).optional(),
    rir: z.number().int().min(0).max(10).optional().nullable(),
    done: z.boolean().optional(),
    order: z.number().int().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'No fields to update',
  });

const createCatalogExerciseSchema = z.object({
  name: z.string().min(1).max(120),
  category: exerciseCategoryEnum,
  muscleGroup: muscleGroupEnum,
  equipmentType: equipmentTypeEnum.optional(),
});

const updateCatalogExerciseSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    category: exerciseCategoryEnum.optional(),
    muscleGroup: muscleGroupEnum.optional(),
    equipmentType: equipmentTypeEnum.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'No fields to update',
  });

const reminderQuerySchema = z.object({
  withinDays: z.coerce.number().int().min(1).max(90).default(14),
});

const heatmapQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(28),
});

const stagnationQuerySchema = z.object({
  window: z.coerce.number().int().min(2).max(8).default(3),
  incrementKg: z.coerce.number().min(0.5).max(10).default(2.5),
  minCompletedSets: z.coerce.number().int().min(1).max(10).default(2),
  minCompletionRatio: z.coerce.number().min(0.3).max(1).default(0.65),
  deloadDropPercent: z.coerce.number().min(0.05).max(0.3).default(0.1),
});

const overloadStrategyEnum = z.enum(['weight-focused', 'rep-focused']);

interface WriteResult {
  status: number;
  body?: unknown;
}

export function createTrainingRouter(
  trainingService: TrainingService,
  idempotencyService: IdempotencyService,
): Router {
  const router = Router();

  const readParam = (req: AuthRequest, key: string): string => {
    const raw = req.params[key];
    return Array.isArray(raw) ? raw[0] ?? '' : raw ?? '';
  };

  const requestPathForIdempotency = (req: AuthRequest): string => {
    return `${req.baseUrl}${req.path}`;
  };

  const handleIdempotentWrite = async (
    req: AuthRequest,
    res: Response,
    action: () => Promise<WriteResult>,
  ): Promise<void> => {
    const userId = req.user!.sub;
    const key = req.header('x-idempotency-key')?.trim();
    const method = req.method.toUpperCase();
    const requestPath = requestPathForIdempotency(req);

    if (key) {
      const replay = await idempotencyService.findReplay(userId, key, method, requestPath);
      if (replay) {
        if (replay.statusCode === 204 || replay.responseBody === undefined || replay.responseBody === null) {
          res.status(replay.statusCode).send();
          return;
        }
        res.status(replay.statusCode).json(replay.responseBody);
        return;
      }
    }

    const result = await action();
    if (key && result.status >= 200 && result.status < 300) {
      await idempotencyService.saveReplay({
        userId,
        key,
        method,
        requestPath,
        statusCode: result.status,
        responseBody: result.body ?? null,
      });
    }

    if (result.status === 204 || result.body === undefined) {
      res.status(result.status).send();
      return;
    }
    res.status(result.status).json(result.body);
  };

  // ── Sessions ─────────────────────────────────────────────────────────────

  router.get('/sessions', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const sessions = await trainingService.listUserSessions(req.user!.sub);
    res.status(200).json({ sessions });
  });

  router.get('/sessions/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const session = await trainingService.getSession(req.user!.sub, readParam(req, 'id'));
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.status(200).json({ session });
  });

  router.post('/sessions', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await handleIdempotentWrite(req, res, async () => {
      const session = await trainingService.createSession(req.user!.sub, parsed.data);
      return { status: 201, body: { session } };
    });
  });

  router.put('/sessions/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await handleIdempotentWrite(req, res, async () => {
      const updated = await trainingService.updateSession(
        req.user!.sub,
        readParam(req, 'id'),
        parsed.data,
      );
      if (!updated) {
        return { status: 404, body: { error: 'Session not found' } };
      }
      return { status: 200, body: { session: updated } };
    });
  });

  router.delete('/sessions/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
    await handleIdempotentWrite(req, res, async () => {
      const deleted = await trainingService.deleteSession(req.user!.sub, readParam(req, 'id'));
      if (!deleted) {
        return { status: 404, body: { error: 'Session not found' } };
      }
      return { status: 204 };
    });
  });

  // ── Exercises & Sets & Cardio ──────────────────────────────────────────

  router.get('/sessions/:id/exercises', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const exercises = await trainingService.listSessionExercises(req.user!.sub, readParam(req, 'id'));
    if (!exercises) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.status(200).json({ exercises });
  });

  router.post('/sessions/:id/exercises', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = createExerciseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await handleIdempotentWrite(req, res, async () => {
      const exercise = await trainingService.createExercise(req.user!.sub, readParam(req, 'id'), parsed.data);
      if (!exercise) {
        return { status: 404, body: { error: 'Session not found' } };
      }
      return { status: 201, body: { exercise } };
    });
  });

  router.get('/sessions/:id/exercises/:exerciseId/cardio', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const record = await trainingService.getCardioRecord(readParam(req, 'exerciseId'));
    res.status(200).json({ record });
  });

  router.post('/sessions/:id/exercises/:exerciseId/cardio', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = createCardioRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const record = await trainingService.createCardioRecord(readParam(req, 'exerciseId'), parsed.data);
    res.status(201).json({ record });
  });

  // ── Sets ────────────────────────────────────────────────────────────────

  router.get('/sessions/:id/exercises/:exerciseId/sets', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const sets = await trainingService.listExerciseSets(
      req.user!.sub,
      readParam(req, 'id'),
      readParam(req, 'exerciseId'),
    );
    if (!sets) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }
    res.status(200).json({ sets });
  });

  router.post('/sessions/:id/exercises/:exerciseId/sets', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = createSetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await handleIdempotentWrite(req, res, async () => {
      const set = await trainingService.createSet(
        req.user!.sub,
        readParam(req, 'id'),
        readParam(req, 'exerciseId'),
        parsed.data,
      );
      if (!set) {
        return { status: 404, body: { error: 'Exercise not found' } };
      }
      return { status: 201, body: { set } };
    });
  });

  router.put('/sessions/:id/exercises/:exerciseId/sets/:setId', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = updateSetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await handleIdempotentWrite(req, res, async () => {
      const set = await trainingService.updateSet(
        req.user!.sub,
        readParam(req, 'id'),
        readParam(req, 'exerciseId'),
        readParam(req, 'setId'),
        parsed.data,
      );
      if (!set) {
        return { status: 404, body: { error: 'Set not found' } };
      }
      return { status: 200, body: { set } };
    });
  });

  router.delete('/sessions/:id/exercises/:exerciseId/sets/:setId', requireAuth as any, async (req: AuthRequest, res: Response) => {
    await handleIdempotentWrite(req, res, async () => {
      const deleted = await trainingService.deleteSet(
        req.user!.sub,
        readParam(req, 'id'),
        readParam(req, 'exerciseId'),
        readParam(req, 'setId'),
      );
      if (!deleted) {
        return { status: 404, body: { error: 'Set not found' } };
      }
      return { status: 204 };
    });
  });

  // ── Plans & Routines ─────────────────────────────────────────────────────

  router.get('/plans', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const plans = await trainingService.listUserPlans(req.user!.sub);
    res.status(200).json({ plans });
  });

  router.post('/plans', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const plan = await trainingService.createPlan(req.user!.sub, parsed.data);
    res.status(201).json({ plan });
  });

  router.get('/plans/:planId/routines', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const routines = await trainingService.listPlanRoutines(readParam(req, 'planId'));
    res.status(200).json({ routines });
  });

  // ── Virtual Trainer & Settings ───────────────────────────────────────────

  router.get('/settings', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const settings = await trainingService.getTrainingSettings(req.user!.sub);
    res.status(200).json({ settings });
  });

  router.put('/settings', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = z.object({ overloadStrategy: overloadStrategyEnum }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const settings = await trainingService.updateTrainingSettings(req.user!.sub, parsed.data.overloadStrategy);
    res.status(200).json({ settings });
  });

  router.get('/suggestions', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const name = typeof req.query['name'] === 'string' ? req.query['name'] : '';
    if (!name) {
      res.status(400).json({ error: 'name query param required' });
      return;
    }
    const suggestion = await trainingService.getExerciseSuggestion(req.user!.sub, name);
    res.status(200).json({ suggestion });
  });

  return router;
}

