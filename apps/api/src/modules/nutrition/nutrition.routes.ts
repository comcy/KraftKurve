import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthRequest, requireUser as requireAuth } from '../../middleware/auth.middleware';
import { NutritionService } from './nutrition.service';
import { IdempotencyService } from '../idempotency/idempotency.service';

const mealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);

const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1).max(200),
  mealType: mealTypeEnum,
  portionG: z.number().min(0).max(9999),
  proteinG: z.number().min(0).max(9999),
  note: z.string().max(2000).optional().nullable(),
});

const updateEntrySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    mealType: mealTypeEnum.optional(),
    portionG: z.number().min(0).max(9999).optional(),
    proteinG: z.number().min(0).max(9999).optional(),
    note: z.string().max(2000).optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

const createFoodItemSchema = z.object({
  name: z.string().min(1).max(200),
  proteinPer100g: z.number().min(0).max(999),
  defaultPortionG: z.number().min(0).max(9999),
});

const updateFoodItemSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    proteinPer100g: z.number().min(0).max(999).optional(),
    defaultPortionG: z.number().min(0).max(9999).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

const setNutritionSettingsSchema = z.object({
  proteinGoalG: z.number().min(1).max(9999).nullable().optional(),
  proteinPresets: z.array(z.number().min(1).max(999)).length(3).optional(),
});

interface WriteResult {
  status: number;
  body?: unknown;
}

function readParam(req: AuthRequest, name: string): string {
  return req.params[name] as string;
}

export function createNutritionRouter(
  nutritionService: NutritionService,
  idempotencyService: IdempotencyService,
): Router {
  const router = Router();

  const requestPathForIdempotency = (req: AuthRequest): string => `${req.baseUrl}${req.path}`;

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

  // ── Day summary ──────────────────────────────────────────────────────────
  router.get('/day/:date', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const date = readParam(req, 'date');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
      return;
    }
    const summary = await nutritionService.getDaySummary(req.user!.sub, date);
    res.status(200).json({ summary });
  });

  // ── User nutrition settings ───────────────────────────────────────────────
  router.get('/settings', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const settings = await nutritionService.getNutritionSettings(req.user!.sub);
    res.status(200).json(settings);
  });

  router.put('/settings', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = setNutritionSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await handleIdempotentWrite(req, res, async () => {
      const settings = await nutritionService.setNutritionSettings(req.user!.sub, parsed.data);
      return { status: 200, body: settings };
    });
  });

  // Backward compatibility
  router.get('/goal', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const settings = await nutritionService.getNutritionSettings(req.user!.sub);
    res.status(200).json({ proteinGoalG: settings.proteinGoalG });
  });

  router.put('/goal', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const schema = z.object({ proteinGoalG: z.number().min(1).max(9999).nullable() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await handleIdempotentWrite(req, res, async () => {
      const settings = await nutritionService.setNutritionSettings(req.user!.sub, { proteinGoalG: parsed.data.proteinGoalG });
      return { status: 200, body: { proteinGoalG: settings.proteinGoalG } };
    });
  });

  // ── Entries ───────────────────────────────────────────────────────────────
  router.post('/entries', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = createEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await handleIdempotentWrite(req, res, async () => {
      const entry = await nutritionService.createEntry(req.user!.sub, parsed.data);
      return { status: 201, body: { entry } };
    });
  });

  router.put('/entries/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = updateEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await handleIdempotentWrite(req, res, async () => {
      const updated = await nutritionService.updateEntry(
        req.user!.sub,
        readParam(req, 'id'),
        parsed.data,
      );
      if (!updated) return { status: 404, body: { error: 'Entry not found' } };
      return { status: 200, body: { entry: updated } };
    });
  });

  router.delete('/entries/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
    await handleIdempotentWrite(req, res, async () => {
      const deleted = await nutritionService.deleteEntry(req.user!.sub, readParam(req, 'id'));
      if (!deleted) return { status: 404, body: { error: 'Entry not found' } };
      return { status: 204 };
    });
  });

  // ── Food-item favorites ───────────────────────────────────────────────────
  router.get('/food-items', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const items = await nutritionService.listFoodItems(req.user!.sub);
    res.status(200).json({ items });
  });

  router.post('/food-items', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = createFoodItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await handleIdempotentWrite(req, res, async () => {
      const item = await nutritionService.createFoodItem(req.user!.sub, parsed.data);
      return { status: 201, body: { item } };
    });
  });

  router.put('/food-items/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
    const parsed = updateFoodItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    await handleIdempotentWrite(req, res, async () => {
      const updated = await nutritionService.updateFoodItem(
        req.user!.sub,
        readParam(req, 'id'),
        parsed.data,
      );
      if (!updated) return { status: 404, body: { error: 'Food item not found' } };
      return { status: 200, body: { item: updated } };
    });
  });

  router.delete('/food-items/:id', requireAuth as any, async (req: AuthRequest, res: Response) => {
    await handleIdempotentWrite(req, res, async () => {
      const deleted = await nutritionService.deleteFoodItem(req.user!.sub, readParam(req, 'id'));
      if (!deleted) return { status: 404, body: { error: 'Food item not found' } };
      return { status: 204 };
    });
  });

  return router;
}
