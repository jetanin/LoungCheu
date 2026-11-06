import 'dotenv/config';
import { createDatabaseClient } from './db/client.js';
import { createApp } from './app.js';
import { readConfig } from './config/env.js';
const config = readConfig();
const db = createDatabaseClient(config.databaseUrl);
const runtime = await createApp(config, db);
const server = runtime.app.listen(config.port, config.production ? '0.0.0.0' : '127.0.0.1', () => console.log(`LoungCheu listening on port ${config.port}`));
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => {
  server.close(() => { void runtime.close().then(() => db.$disconnect()).then(() => process.exit(0)); });
});
