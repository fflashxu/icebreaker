import { Router, Request, Response, NextFunction } from 'express';
import * as profilesService from './profiles.service';
import { createProfileSchema, updateProfileSchema } from '../../shared/validation';
import { authenticate } from '../../middleware/authenticate';

export const profilesRouter = Router();

profilesRouter.use(authenticate);

profilesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await profilesService.listProfiles(req.user!.id));
  } catch (e) {
    next(e);
  }
});

profilesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProfileSchema.parse(req.body);
    const profile = await profilesService.createProfile(req.user!.id, data);
    res.status(201).json(profile);
  } catch (e) {
    next(e);
  }
});

profilesRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = await profilesService.updateProfile(req.params.id, req.user!.id, data);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

profilesRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await profilesService.deleteProfile(req.params.id, req.user!.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
