import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { profilesRouter } from './modules/profiles/profiles.controller';
import { parseRouter } from './modules/parse/parse.controller';
import { generateRouter } from './modules/generate/generate.controller';
import { authRouter } from './modules/auth/auth.controller';
import { adminRouter } from './modules/admin/admin.controller';

const app = express();

if (env.NODE_ENV === 'production') {
  app.use(cors({ origin: false }));
} else {
  app.use(cors({ origin: env.FRONTEND_URL }));
}

app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/parse', parseRouter);
app.use('/api/generate', generateRouter);

if (env.NODE_ENV === 'production') {
  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use(errorHandler);

export default app;
