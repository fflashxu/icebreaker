import { env } from './config/env';
import app from './app';
import fs from 'fs';
import path from 'path';

// Ensure required directories exist
const uploadDir = path.resolve(__dirname, '../uploads');
const dataDir = path.resolve(__dirname, 'data');
const profilesFile = path.join(dataDir, 'profiles.json');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(profilesFile)) fs.writeFileSync(profilesFile, '[]', 'utf-8');

app.listen(env.PORT, () => {
  console.log(`[email-gen backend] Listening on http://localhost:${env.PORT}`);
  if (!env.DASHSCOPE_API_KEY) {
    console.warn('[WARN] DASHSCOPE_API_KEY is not set');
  }
});
