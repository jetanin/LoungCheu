import 'dotenv/config';
import { createDatabaseClient } from '../src/db/client.js';
import { seedUsers } from '../src/modules/accounts/seed.js';
const db = createDatabaseClient(process.env.DATABASE_URL ?? '');
try { await seedUsers(db, process.env.DEMO_SEED_PASSWORD ?? ''); console.log('Synthetic accounts seeded (credentials omitted).'); }
finally { await db.$disconnect(); }
