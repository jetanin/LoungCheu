import { config } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readTestDatabaseUrl } from '../server/src/config/database-url.js';
config({ path: '.env.test', quiet: true });
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url)), 'migrate', 'deploy', '--config', 'server/prisma.config.ts'], {
  env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit',
});
process.exit(result.status ?? 1);
