import { env } from './config/env';
import app from './app';
import fs from 'fs';
import { seedAdminUser } from './modules/auth/auth.service';

async function main() {
  const uploadDir = env.UPLOAD_DIR;
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  await seedAdminUser();

  app.listen(env.PORT, () => {
    console.log(`[email-gen backend] Listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error('[startup error]', err);
  process.exit(1);
});
