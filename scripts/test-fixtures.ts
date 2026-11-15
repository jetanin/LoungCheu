import type { PrismaClient } from '@prisma/client';
import { demoUsers } from '../server/src/modules/accounts/seed.js';
import { hashPassword } from '../server/src/modules/accounts/password.js';

// Deliberately separate from production seeding. Verify the actual connection,
// not only an environment variable, before resetting disposable test accounts.
export async function resetTestUsers(db: PrismaClient, password: string) {
  const target = await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  if (target.length !== 1 || target[0].name !== 'loungcheu_test') {
    throw new Error('Test fixtures may only reset accounts in loungcheu_test');
  }
  if (!password) throw new Error('A private test fixture password is required');
  for (const user of demoUsers) {
    const passwordHash = await hashPassword(password);
    await db.user.upsert({ where: { username: user.username }, create: { ...user, passwordHash }, update: { ...user, passwordHash } });
  }
}
