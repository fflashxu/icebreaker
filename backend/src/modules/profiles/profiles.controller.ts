import { Router, Request, Response, NextFunction } from 'express';
import * as profilesService from './profiles.service';
import { createProfileSchema, updateProfileSchema } from '../../shared/validation';

export const profilesRouter = Router();

profilesRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(profilesService.listProfiles());
  } catch (e) {
    next(e);
  }
});

profilesRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProfileSchema.parse(req.body);
    const profile = profilesService.createProfile(data);
    res.status(201).json(profile);
  } catch (e) {
    next(e);
  }
});

profilesRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = profilesService.updateProfile(req.params.id, data);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

profilesRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    profilesService.deleteProfile(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
