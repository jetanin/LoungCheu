import { config } from 'dotenv';
import { createDatabaseClient } from '../server/src/db/client.js';
import { createApp } from '../server/src/app.js';
import { readConfig } from '../server/src/config/env.js';
import { seedUsers } from '../server/src/modules/accounts/seed.js';
import { readTestDatabaseUrl } from '../server/src/config/database-url.js';
config({ path: '.env.test', quiet: true });
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url);
await seedUsers(db, process.env.E2E_PASSWORD ?? '');
const runtime = await createApp(readConfig({ DATABASE_URL: url, SESSION_SECRET: 'e2e-only-secret-not-for-deployment-123456789', APP_ORIGIN: 'http://127.0.0.1:5173', NODE_ENV: 'test' }), db);
const server = runtime.app.listen(3001, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => {
  server.close(() => { void runtime.close().then(() => db.$disconnect()).then(() => process.exit(0)); });
});
