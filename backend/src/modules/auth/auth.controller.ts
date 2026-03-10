import { Router, Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, updateKeySchema } from '../../shared/validation';
import { ForbiddenError } from '../../shared/errors';
import { authenticate } from '../../middleware/authenticate';
import * as authService from './auth.service';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.name, body.email, body.password);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// PUT /api/auth/dashscope-key
authRouter.put('/dashscope-key', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateKeySchema.parse(req.body);
    const user = await authService.updateDashscopeKey(req.user!.id, body.dashscopeKey);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/invite-tokens (Admin only)
authRouter.post('/invite-tokens', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user!.isAdmin) return next(new ForbiddenError('Admin only'));
    const invite = await authService.createInviteToken();
    res.status(201).json(invite);
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/invite-tokens (Admin only)
authRouter.get('/invite-tokens', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user!.isAdmin) return next(new ForbiddenError('Admin only'));
    const tokens = await authService.listInviteTokens();
    res.json(tokens);
  } catch (e) {
    next(e);
  }
});
