import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { profilesRouter } from './modules/profiles/profiles.controller';
import { parseRouter } from './modules/parse/parse.controller';
import { generateRouter } from './modules/generate/generate.controller';

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/profiles', profilesRouter);
app.use('/api/parse', parseRouter);
app.use('/api/generate', generateRouter);

app.use(errorHandler);

export default app;
