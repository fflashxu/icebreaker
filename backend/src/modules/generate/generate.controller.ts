import { Router, Request, Response, NextFunction } from 'express';
import { generateSchema, translateSchema } from '../../shared/validation';
import { generateEmails, translateEmail } from './generate.service';
import { getProfileById } from '../profiles/profiles.service';
import { authenticate } from '../../middleware/authenticate';
import { UnprocessableError } from '../../shared/errors';

export const generateRouter = Router();

generateRouter.use(authenticate);

generateRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashscopeKey = req.user!.dashscopeKey;
    if (!dashscopeKey) {
      return next(new UnprocessableError('请先在设置中添加 DashScope Key'));
    }

    const body = generateSchema.parse(req.body);
    const profile = await getProfileById(body.profileId, req.user!.id);

    const emails = await generateEmails({
      candidateText: body.candidateText,
      profile,
      style: body.style,
      targetLanguage: body.targetLanguage,
      jobTitle: body.jobTitle,
      count: body.count as 1 | 2 | 3,
      dashscopeKey,
    });

    res.json({ emails });
  } catch (e) {
    next(e);
  }
});

generateRouter.post('/translate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashscopeKey = req.user!.dashscopeKey;
    if (!dashscopeKey) {
      return next(new UnprocessableError('请先在设置中添加 DashScope Key'));
    }

    const body = translateSchema.parse(req.body);
    const result = await translateEmail(body.subject, body.body, body.targetLanguage, dashscopeKey);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
