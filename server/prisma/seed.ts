import 'dotenv/config';
import { createDatabaseClient } from '../src/db/client.js';
import { seedUsers } from '../src/modules/accounts/seed.js';
import { readDatabaseUrl } from '../src/config/database-url.js';
import { seedDemoEvents } from './demo-data.js';
const db = createDatabaseClient(readDatabaseUrl(process.env.DATABASE_URL));
try {
  await seedUsers(db, process.env.DEMO_SEED_PASSWORD ?? '');
  const result = await seedDemoEvents(db);
  console.log(JSON.stringify({ message: 'Synthetic accounts and demo events seeded (credentials omitted).', ...result }));
}
finally { await db.$disconnect(); }
