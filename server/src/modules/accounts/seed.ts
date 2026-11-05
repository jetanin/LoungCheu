import type { PrismaClient, Role } from '@prisma/client';
import { hashPassword, verifyPassword } from './password.js';

export const demoUsers: { username: string; displayName: string; role: Role; isActive: boolean }[] = [
  { username: 'participant.a', displayName: 'Participant A', role: 'PARTICIPANT', isActive: true },
  { username: 'participant.b', displayName: 'Participant B', role: 'PARTICIPANT', isActive: true },
  { username: 'participant.c', displayName: 'Participant C', role: 'PARTICIPANT', isActive: true },
  { username: 'organizer.a', displayName: 'Organizer A', role: 'ORGANIZER', isActive: true },
  { username: 'organizer.b', displayName: 'Organizer B', role: 'ORGANIZER', isActive: true },
  { username: 'inactive.x', displayName: 'Inactive X', role: 'PARTICIPANT', isActive: false },
];

export async function seedUsers(db: PrismaClient, password: string) {
  if (!password) throw new Error('Set DEMO_SEED_PASSWORD privately before seeding');
  for (const user of demoUsers) {
    const existing = await db.user.findUnique({ where: { username: user.username } });
    const passwordHash = existing && await verifyPassword(password, existing.passwordHash)
      ? existing.passwordHash : await hashPassword(password);
    await db.user.upsert({ where: { username: user.username }, create: { ...user, passwordHash }, update: { ...user, passwordHash } });
  }
}
