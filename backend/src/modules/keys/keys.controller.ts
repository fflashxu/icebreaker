import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/authenticate';
import { ValidationError } from '../../shared/errors';

export const keysRouter = Router();
keysRouter.use(authenticate);

// Supported providers config
export const PROVIDER_CONFIG: Record<string, { name: string; baseUrl: string; models: string[] }> = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-chat', 'deepseek-reasoner'],
  },
  dashscope: {
    name: 'DashScope (阿里 Qwen)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-3.8', 'qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen-vl-plus'],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'o3-mini'],
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['kimi-k3', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  zhipu: {
    name: 'Zhipu (智谱 GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4.5', 'glm-4-plus', 'glm-4-flash'],
  },
  bytedance: {
    name: 'ByteDance (豆包)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-seed-1.6', 'doubao-pro-32k', 'doubao-lite-32k'],
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  stepfun: {
    name: 'StepFun (阶跃星辰)',
    baseUrl: 'https://api.stepfun.com/v1',
    models: ['step-3-16k', 'step-2-16k', 'step-1.5v-mini'],
  },
  minimax: {
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    models: ['MiniMax-M2', 'MiniMax-Text-01', 'abab7-chat'],
  },
};

// GET /api/keys — list user's keys + the system default (if any)
keysRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
    });
    const masked = keys.map(k => ({
      ...k,
      apiKey: k.apiKey.substring(0, 8) + '...' + k.apiKey.slice(-4),
    }));
    // Find the system default key (admin's key marked as default)
    const defaultKey = await prisma.apiKey.findFirst({
      where: { isDefault: true },
      select: { id: true, provider: true, label: true, model: true },
    });
    res.json({ keys: masked, providers: PROVIDER_CONFIG, defaultKey });
  } catch (e) { next(e); }
});

// POST /api/keys — add a key. Admin can set isDefault.
keysRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider, label, apiKey, baseUrl, model, isDefault } = req.body;
    if (!provider || !apiKey) return next(new ValidationError('provider and apiKey required'));
    if (!PROVIDER_CONFIG[provider]) return next(new ValidationError(`Unknown provider: ${provider}`));
    // Only one default key system-wide — admin only
    if (isDefault && !req.user!.isAdmin) return next(new ValidationError('Only admin can set system default key'));
    if (isDefault) {
      await prisma.apiKey.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const key = await prisma.apiKey.create({
      data: {
        userId: req.user!.id,
        provider,
        label: label || PROVIDER_CONFIG[provider].name,
        apiKey,
        baseUrl: baseUrl || PROVIDER_CONFIG[provider].baseUrl,
        model: model || PROVIDER_CONFIG[provider].models[0],
        isDefault: isDefault || false,
      },
    });
    res.status(201).json({ ...key, apiKey: key.apiKey.substring(0, 8) + '...' + key.apiKey.slice(-4) });
  } catch (e) { next(e); }
});

// PUT /api/keys/:id/default — toggle system default (admin only)
keysRouter.put('/:id/default', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user!.isAdmin) return next(new ValidationError('Admin only'));
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key || key.userId !== req.user!.id) return next(new ValidationError('Key not found'));
    await prisma.apiKey.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    const updated = await prisma.apiKey.update({ where: { id: req.params.id }, data: { isDefault: true } });
    res.json({ ...updated, apiKey: updated.apiKey.substring(0, 8) + '...' + updated.apiKey.slice(-4) });
  } catch (e) { next(e); }
});

// DELETE /api/keys/:id
keysRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!key || key.userId !== req.user!.id) return next(new ValidationError('Key not found'));
    await prisma.apiKey.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) { next(e); }
});

// GET /api/keys/stats — admin: provider usage stats
keysRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user!.isAdmin) return next(new ValidationError('Admin only'));
    const keys = await prisma.apiKey.findMany({ select: { provider: true, userId: true, label: true } });
    const providerUsers: Record<string, { count: number; name: string }> = {};
    for (const k of keys) {
      if (!providerUsers[k.provider]) providerUsers[k.provider] = { count: 0, name: PROVIDER_CONFIG[k.provider]?.name || k.provider };
      providerUsers[k.provider].count++;
    }
    const stats = Object.entries(providerUsers).map(([provider, data]) => ({
      provider, name: data.name, userCount: data.count,
    })).sort((a, b) => b.userCount - a.userCount);
    // Also include total unique users with keys
    const totalUsers = new Set(keys.map(k => k.userId)).size;
    res.json({ totalUsers, stats });
  } catch (e) { next(e); }
});

// POST /api/keys/migrate-legacy — migrate User.dashscopeKey to ApiKey
keysRouter.post('/migrate-legacy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.dashscopeKey) return res.json({ migrated: false, reason: 'No legacy key found' });
    const existing = await prisma.apiKey.findFirst({
      where: { userId: req.user!.id, provider: 'dashscope' },
    });
    if (existing) return res.json({ migrated: false, reason: 'DashScope key already exists' });
    await prisma.apiKey.create({
      data: { userId: req.user!.id, provider: 'dashscope', label: 'DashScope (migrated)', apiKey: user.dashscopeKey, model: 'qwen-plus' },
    });
    res.json({ migrated: true });
  } catch (e) { next(e); }
});
