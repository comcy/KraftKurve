import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { requireAdmin, AuthRequest } from '../../middleware/auth.middleware';

const registerSchema = z.object({
  inviteCode: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const bootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  /** POST /auth/bootstrap – one-time admin setup */
  router.post('/bootstrap', async (req: Request, res: Response) => {
    const parsed = bootstrapSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const user = await authService.bootstrapAdmin(parsed.data.email, parsed.data.password);
      res.status(201).json({ id: user.id, email: user.email, role: user.role });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(409).json({ error: message });
    }
  });

  /** POST /auth/invite – admin creates invite (JWT required, role=admin) */
  router.post('/invite', requireAdmin as any, async (req: AuthRequest, res: Response) => {
    try {
      const invite = await authService.createInvite(req.user!.sub);
      res.status(201).json({ code: invite.code, expiresAt: invite.expiresAt });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  /** POST /auth/register – new user with invite code */
  router.post('/register', async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const { user, token } = await authService.register(
        parsed.data.inviteCode,
        parsed.data.email,
        parsed.data.password,
        parsed.data.displayName,
      );
      res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({ error: message });
    }
  });

  /** POST /auth/login */
  router.post('/login', async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      const { user, token } = await authService.login(parsed.data.email, parsed.data.password);
      res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(401).json({ error: message });
    }
  });

  return router;
}
