import { Router, Request, Response, NextFunction } from 'express';
import { generateSchema, translateSchema } from '../../shared/validation';
import { generateEmails, translateEmail } from './generate.service';
import { getProfileById } from '../profiles/profiles.service';
import { authenticate } from '../../middleware/authenticate';
import { UnprocessableError } from '../../shared/errors';
import { prisma } from '../../lib/prisma';

export const generateRouter = Router();

generateRouter.use(authenticate);

generateRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = generateSchema.parse(req.body);

    // Resolve API key with free tier support
    let apiKey: string, baseUrl: string, model: string, provider: string;
    let usedFree = false;

    // 1. Explicit keyId takes priority
    if (body.keyId) {
      const key = await prisma.apiKey.findUnique({ where: { id: body.keyId } });
      if (!key || key.userId !== req.user!.id) return next(new UnprocessableError('Invalid API key'));
      apiKey = key.apiKey;
      baseUrl = key.baseUrl || 'https://api.openai.com/v1';
      model = body.model || key.model || 'gpt-4o';
      provider = key.provider;
    }
    // 2. User has free quota — use admin's system default key
    else {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      const defaultKey = await prisma.apiKey.findFirst({ where: { isDefault: true } });
      if (user && user.freeQuota > 0 && defaultKey) {
        apiKey = defaultKey.apiKey;
        baseUrl = defaultKey.baseUrl || 'https://api.deepseek.com/v1';
        model = body.model || defaultKey.model || 'deepseek-v4-pro';
        provider = 'system';
        usedFree = true;
      }
      // 3. Try user's own active key
      else {
        const firstKey = await prisma.apiKey.findFirst({
          where: { userId: req.user!.id, isActive: true },
        });
        if (firstKey) {
          apiKey = firstKey.apiKey;
          baseUrl = firstKey.baseUrl || 'https://api.openai.com/v1';
          model = body.model || firstKey.model || 'gpt-4o';
          provider = firstKey.provider;
        } else if (req.user!.dashscopeKey) {
          apiKey = req.user!.dashscopeKey;
          baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
          model = 'qwen-plus';
          provider = 'dashscope';
        } else {
          return next(new UnprocessableError('Free quota exhausted. Please add your own API Key in Settings.'));
        }
      }
    }

    const profile = await getProfileById(body.profileId, req.user!.id);

    const emails = await generateEmails({
      candidateText: body.candidateText,
      profile,
      style: body.style,
      targetLanguage: body.targetLanguage,
      jobTitle: body.jobTitle,
      count: body.count as 1 | 2 | 3,
      apiKey,
      baseUrl,
      model,
      provider,
    });

    await prisma.generationLog.create({
      data: { userId: req.user!.id, count: emails.length, style: body.style, provider },
    });

    // Decrement free quota if used
    if (usedFree) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { freeQuota: { decrement: emails.length } },
      });
    }

    res.json({ emails, freeQuotaRemaining: usedFree ? Math.max(0, (await prisma.user.findUnique({ where: { id: req.user!.id } }))!.freeQuota) : undefined });
  } catch (e) {
    next(e);
  }
});

generateRouter.get('/style-stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.generationLog.groupBy({
      by: ['style'],
      where: { style: { not: null } },
      _sum: { count: true },
    });
    const stats: Record<string, number> = {};
    for (const log of logs) {
      if (log.style) stats[log.style] = log._sum.count ?? 0;
    }
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

generateRouter.post('/translate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = translateSchema.parse(req.body);

    let apiKey: string, baseUrl: string, model: string;
    const firstKey = await prisma.apiKey.findFirst({
      where: { userId: req.user!.id, isActive: true },
    });
    if (firstKey) {
      apiKey = firstKey.apiKey;
      baseUrl = firstKey.baseUrl || 'https://api.openai.com/v1';
      model = body.model || firstKey.model || 'gpt-4o';
    } else if (req.user!.dashscopeKey) {
      apiKey = req.user!.dashscopeKey;
      baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
      model = 'qwen-plus';
    } else {
      return next(new UnprocessableError('请先在设置中添加 API Key'));
    }

    const result = await translateEmail(body.subject, body.body, body.targetLanguage, apiKey, baseUrl, model);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
