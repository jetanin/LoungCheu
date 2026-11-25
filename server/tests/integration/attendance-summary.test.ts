import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import type { EventStatus, RegistrationStatus } from '@prisma/client';
import { createDatabaseClient } from '../../src/db/client.js';
import { createApp } from '../../src/app.js';
import { readConfig } from '../../src/config/env.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { resetTestUsers } from '../../../scripts/test-fixtures.js';

// F-09 Attendance summary — Sprint 3 STS §3 (TEST-60–TEST-63, API/DB part).
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url);
const password = randomBytes(24).toString('hex'), t0 = Date.parse('2026-11-06T03:00:00.000Z');
let clock = t0;
const ids: string[] = [];
let runtime: Awaited<ReturnType<typeof createApp>>;
type Who = 'PA' | 'PB' | 'PC' | 'OA' | 'OB';
const usernames: Record<Who, string> = { PA: 'participant.a', PB: 'participant.b', PC: 'participant.c', OA: 'organizer.a', OB: 'organizer.b' };
const users = {} as Record<Who, string>;
type Session = { agent: ReturnType<typeof request.agent>; token: string };
const sessions = {} as Record<Who, Session>;

async function login(who: Who): Promise<Session> {
  const agent = request.agent(runtime.app);
  const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
  await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username: usernames[who], password }).expect(200);
  return { agent, token: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string };
}
const summary = (agent: ReturnType<typeof request.agent> | ReturnType<typeof request>, id: string) => agent.get(`/api/organizer/events/${id}/summary`);
// "error ไม่มียอดหรือข้อมูลกิจกรรม": only the error envelope comes back.
function rejected(r: request.Response, status: number, code: string) {
  expect({ status: r.status, code: r.body?.error?.code }).toEqual({ status, code });
  expect(r.body.data).toBeUndefined();
  expect(JSON.stringify(r.body)).not.toMatch(/active_count|cancelled_count|checked_in_count|attendance_rate/);
}

// STS §1 fixtures (owner, status, capacity, registrations).
type Kind = { owner: Who; status: EventStatus; capacity: number; registrations: [Who, RegistrationStatus][] };
const kinds = {
  ESUM3: { owner: 'OA', status: 'PUBLISHED', capacity: 5, registrations: [['PA', 'ACTIVE'], ['PB', 'ACTIVE'], ['PC', 'CANCELLED']] },
  EOTHER3: { owner: 'OB', status: 'PUBLISHED', capacity: 5, registrations: [['PA', 'ACTIVE']] },
} satisfies Record<string, Kind>;
async function fixture(kind: keyof typeof kinds) {
  const { owner, status, capacity, registrations } = kinds[kind] as Kind, id = randomUUID(), before = new Date(t0 - 60_000);
  ids.push(id);
  const event = await db.event.create({ data: { id, organizerId: users[owner], title: kind, description: 'Synthetic F-09 fixture', location: 'KMUTT',
    capacity, status, registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 7_200_000), endsAt: new Date(t0 + 14_400_000),
    createdAt: before, updatedAt: before } });
  for (const [who, state] of registrations) await db.registration.create({ data: {
    eventId: id, participantId: users[who], status: state, registeredAt: before, cancelledAt: state === 'CANCELLED' ? new Date(t0 - 30_000) : null,
    history: { create: [{ actorId: users[who], action: 'REGISTERED', occurredAt: before },
      ...(state === 'CANCELLED' ? [{ actorId: users[who], action: 'CANCELLED' as const, occurredAt: new Date(t0 - 30_000) }] : [])] },
  } });
  return event;
}

beforeAll(async () => {
  await resetTestUsers(db, password);
  for (const who of Object.keys(usernames) as Who[]) users[who] = (await db.user.findUniqueOrThrow({ where: { username: usernames[who] } })).id;
  const config = readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173' });
  runtime = await createApp(config, db, () => clock);
  for (const who of Object.keys(usernames) as Who[]) sessions[who] = await login(who);
});
afterEach(() => { clock = t0; });
afterAll(async () => {
  try {
    await db.$transaction([
      db.registrationHistory.deleteMany({ where: { registration: { eventId: { in: ids } } } }),
      db.registration.deleteMany({ where: { eventId: { in: ids } } }),
      db.event.deleteMany({ where: { id: { in: ids } } }),
    ]);
  } finally {
    await runtime.close();
    await db.$disconnect();
  }
});

describe('F-09 GET /api/organizer/events/{id}/summary access (TEST-63 / AC-50)', () => {
  it('rejects anonymous, participant, other organizer, unknown and malformed ids without leaking counts', async () => {
    const event = await fixture('ESUM3');
    await fixture('EOTHER3');
    rejected(await summary(request(runtime.app), event.id), 401, 'AUTH_REQUIRED');
    rejected(await summary(sessions.PA.agent, event.id), 403, 'ROLE_FORBIDDEN');
    rejected(await summary(sessions.OB.agent, event.id), 404, 'EVENT_NOT_FOUND');
    rejected(await summary(sessions.OA.agent, randomUUID()), 404, 'EVENT_NOT_FOUND');
    rejected(await summary(sessions.OA.agent, 'not-a-uuid'), 400, 'INVALID_INPUT');
  });
});
