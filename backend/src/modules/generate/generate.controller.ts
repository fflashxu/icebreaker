import { Router, Request, Response, NextFunction } from 'express';
import { generateSchema, translateSchema } from '../../shared/validation';
import { generateEmails, translateEmail } from './generate.service';
import { getProfileById } from '../profiles/profiles.service';

export const generateRouter = Router();

generateRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = generateSchema.parse(req.body);
    const profile = getProfileById(body.profileId);

    const emails = await generateEmails({
      candidateText: body.candidateText,
      profile,
      style: body.style,
      targetLanguage: body.targetLanguage,
      jobTitle: body.jobTitle,
      count: body.count as 1 | 2 | 3,
    });

    res.json({ emails });
  } catch (e) {
    next(e);
  }
});

generateRouter.post('/translate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = translateSchema.parse(req.body);
    const result = await translateEmail(body.subject, body.body, body.targetLanguage);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
