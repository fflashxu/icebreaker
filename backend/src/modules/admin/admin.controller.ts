import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { ForbiddenError } from '../../shared/errors';
import { getStats } from './admin.service';

export const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.use((_req: Request, _res: Response, next: NextFunction) => {
  if (!_req.user?.isAdmin) return next(new ForbiddenError());
  next();
});

adminRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (e) {
    next(e);
  }
});
