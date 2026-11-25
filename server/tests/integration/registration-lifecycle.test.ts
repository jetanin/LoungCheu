import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { EventStatus } from '@prisma/client';
import { createDatabaseClient } from '../../src/db/client.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { readConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

// Initial F-06 RED slice: public HTTP behaviour against real PostgreSQL.
// No new service/schema imports: failures must be missing behaviour assertions,
// rather than a missing module, generated Prisma type, or history table.
const databaseUrl = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(databaseUrl);
const ids = { oa: randomUUID(), ob: randomUUID(), pa: randomUUID(), pb: randomUUID() };
type Account = keyof typeof ids;
type Session = { agent: ReturnType<typeof request.agent>; token: string };
const sessions = new Map<Account, Session>();
const password = randomBytes(24).toString('hex');
const t0 = Date.parse('2026-11-06T03:00:00.000Z');
let clock = t0;
let runtime: Awaited<ReturnType<typeof createApp>>;
const eventIds: string[] = [];

async function fixture(status: EventStatus = 'PUBLISHED', deadline = t0 + 3_600_000) {
  const id = randomUUID();
  eventIds.push(id);
  return db.event.create({ data: {
    id, organizerId: ids.oa, title: 'F-06 synthetic lifecycle', description: 'Isolated test data',
    location: 'Test room', capacity: 1, status, registrationClosesAt: new Date(deadline),
    startsAt: new Date(t0 + 7_200_000), endsAt: new Date(t0 + 14_400_000),
    createdAt: new Date(t0 - 1_000), updatedAt: new Date(t0 - 1_000),
  } });
}

function mutation(account: Account, path: string) {
  const { agent, token } = sessions.get(account)!;
  return agent.post(path).set('X-CSRF-Token', token).send({});
}
function register(account: Account, eventId: string) {
  return mutation(account, `/api/events/${eventId}/registrations`);
}
function cancel(account: Account, registrationId: string) {
  return mutation(account, `/api/my/registrations/${registrationId}/cancel`);
}
function close(account: Account, eventId: string) {
  return mutation(account, `/api/organizer/events/${eventId}/close`);
}
function error(response: request.Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String), fields: {} } });
}
async function history(reference: string) {
  return db.$queryRaw<{ action: string; actor_id: string; occurred_at: Date }[]>`
    SELECT action::text, actor_id, occurred_at FROM registration_history
    WHERE registration_id = ${reference}::uuid ORDER BY occurred_at, id
  `;
}

beforeAll(async () => {
  // Check the connected database as well as the URL guard before any fixtures.
  const target = await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  expect(target).toEqual([{ name: 'loungcheu_test' }]);
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: (Object.keys(ids) as Account[]).map(account => ({
    id: ids[account], username: `f06-${ids[account]}`, passwordHash, displayName: account.toUpperCase(),
    role: account.startsWith('o') ? 'ORGANIZER' as const : 'PARTICIPANT' as const,
  })) });
  runtime = await createApp(readConfig({
    DATABASE_URL: databaseUrl, SESSION_SECRET: randomBytes(48).toString('hex'),
    APP_ORIGIN: 'http://127.0.0.1:5173', NODE_ENV: 'test',
  }), db, () => clock);
  for (const account of Object.keys(ids) as Account[]) {
    const agent = request.agent(runtime.app);
    const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
    await agent.post('/api/auth/login').set('X-CSRF-Token', pre)
      .send({ username: `f06-${ids[account]}`, password }).expect(200);
    const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
    sessions.set(account, { agent, token });
  }
});

afterEach(async () => {
  // S1 has no history table. Once S2 exists, remove only this suite's history
  // before its registrations (history FKs intentionally use RESTRICT).
  const tables = await db.$queryRaw<{ name: string | null }[]>`
    SELECT to_regclass('public.registration_history')::text AS name
  `;
  if (tables[0].name && eventIds.length) {
    await db.$executeRaw`
      DELETE FROM registration_history WHERE registration_id IN
      (SELECT id FROM registrations WHERE event_id = ANY(${eventIds}::uuid[]))
    `;
  }
  await db.registration.deleteMany({ where: { eventId: { in: eventIds } } });
  await db.event.deleteMany({ where: { id: { in: eventIds } } });
  eventIds.length = 0;
  clock = t0;
});
afterAll(async () => {
  try {
    if (runtime) await runtime.close();
    await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  } finally { await db.$disconnect(); }
});

describe('F-06 lifecycle / initial RED slice', () => {
  it('TEST-37: cancel frees the last seat for a previously rejected participant', async () => {
    const event = await fixture();
    const first = await register('pa', event.id);
    expect(first.status).toBe(201);
    const reference = first.body.data.id as string;
    error(await register('pb', event.id), 409, 'EVENT_FULL');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(1);

    const result = await cancel('pa', reference);
    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({
      id: reference, status: 'CANCELLED', registered_at: new Date(t0).toISOString(),
      cancelled_at: new Date(t0).toISOString(), event: { id: event.id },
    });
    expect(await db.registration.count({ where: { eventId: event.id, status: 'ACTIVE' } })).toBe(0);
    const available = await sessions.get('pa')!.agent.get(`/api/events/${event.id}`).expect(200);
    expect(available.body.data).toMatchObject({ active_count: 0, available_seats: 1 });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).updatedAt).toEqual(event.updatedAt);
    const cancelledHistory = await history(reference);
    expect(cancelledHistory).toHaveLength(2);
    expect(cancelledHistory).toEqual(expect.arrayContaining([
      { action: 'REGISTERED', actor_id: ids.pa, occurred_at: new Date(t0) },
      { action: 'CANCELLED', actor_id: ids.pa, occurred_at: new Date(t0) },
    ])); // UUID order must not imply action order when timestamps are equal.
    const retry = await register('pb', event.id);
    expect(retry.status).toBe(201);
    expect(await db.registration.count({ where: { eventId: event.id, status: 'ACTIVE' } })).toBe(1);
    expect(await history(retry.body.data.id)).toEqual([
      { action: 'REGISTERED', actor_id: ids.pb, occurred_at: new Date(t0) },
    ]);
  });

  it('TEST-38: two cancel/reactivate cycles retain one reference and first registration time', async () => {
    const event = await fixture();
    const firstTime = t0 - 7_200_000;
    clock = firstTime;
    const first = await register('pa', event.id);
    expect(first.status).toBe(201);
    const reference = first.body.data.id as string;
    const actions = ['REGISTERED'];
    for (const [cancelTime, reactivateTime] of [[t0 - 3_600_000, t0], [t0 + 60_000, t0 + 120_000]]) {
      clock = cancelTime;
      expect((await cancel('pa', reference)).status).toBe(200);
      actions.push('CANCELLED');
      clock = reactivateTime;
      const result = await register('pa', event.id);
      expect(result.status).toBe(200);
      expect(result.body.data).toMatchObject({ id: reference, status: 'ACTIVE',
        registered_at: new Date(firstTime).toISOString(), cancelled_at: null });
      actions.push('REACTIVATED');
    }
    expect(await db.registration.count({ where: { eventId: event.id, participantId: ids.pa } })).toBe(1);
    const records = await history(reference);
    expect(records.map(row => row.action)).toEqual(actions);
    expect(records.map(row => row.actor_id)).toEqual(Array(5).fill(ids.pa));
    expect(records.map(row => row.occurred_at.getTime())).toEqual([firstTime, t0 - 3_600_000, t0, t0 + 60_000, t0 + 120_000]);
  });

  it.each([-1, 0, 1])('TEST-39: close is allowed at deadline offset %i ms and preserves registrations', async offset => {
    const event = await fixture('PUBLISHED', t0 + 3_600_000);
    const first = await register('pa', event.id);
    expect(first.status).toBe(201);
    const before = await db.registration.findMany({ where: { eventId: event.id } });
    clock = event.registrationClosesAt.getTime() + offset;
    const result = await close('oa', event.id);
    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({ id: event.id, status: 'CLOSED',
      active_count: 1, available_seats: 0, registration_open: false, updated_at: new Date(clock).toISOString() });
    expect(await db.registration.findMany({ where: { eventId: event.id } })).toEqual(before);
    error(await close('oa', event.id), 409, 'INVALID_TRANSITION');
    error(await register('pb', event.id), 409, 'REGISTRATION_CLOSED');
    error(await cancel('pa', first.body.data.id), 409, 'REGISTRATION_CLOSED');
    expect(await history(first.body.data.id)).toEqual([
      { action: 'REGISTERED', actor_id: ids.pa, occurred_at: new Date(t0) },
    ]);
  });

  it.each([-1, 0, 1])('TEST-40: cancel enforces deadline offset %i ms without changing rejected records', async offset => {
    const event = await fixture();
    const first = await register('pa', event.id);
    expect(first.status).toBe(201);
    const reference = first.body.data.id as string;
    const before = await db.registration.findUniqueOrThrow({ where: { id: reference } });
    clock = event.registrationClosesAt.getTime() + offset;
    const result = await cancel('pa', reference);
    if (offset < 0) {
      expect(result.status).toBe(200);
      expect(result.body.data.cancelled_at).toBe(new Date(clock).toISOString());
      error(await cancel('pa', reference), 409, 'ALREADY_CANCELLED');
    } else {
      error(result, 409, 'REGISTRATION_CLOSED');
      expect(await db.registration.findUniqueOrThrow({ where: { id: reference } })).toEqual(before);
    }
  });

  it('TEST-41: cancel and close enforce auth, role, ownership and CSRF', async () => {
    const event = await fixture();
    const first = await register('pa', event.id);
    expect(first.status).toBe(201);
    const reference = first.body.data.id as string;
    const before = await db.registration.findUniqueOrThrow({ where: { id: reference } });
    const cancelPath = `/api/my/registrations/${reference}/cancel`;
    const closePath = `/api/organizer/events/${event.id}/close`;
    for (const path of [cancelPath, closePath]) error(await request(runtime.app).post(path).send({}), 401, 'AUTH_REQUIRED');
    error(await cancel('oa', reference), 403, 'ROLE_FORBIDDEN');
    error(await cancel('pb', reference), 404, 'REGISTRATION_NOT_FOUND');
    error(await close('pa', event.id), 403, 'ROLE_FORBIDDEN');
    error(await close('ob', event.id), 404, 'EVENT_NOT_FOUND');
    error(await sessions.get('pa')!.agent.post(cancelPath).send({}), 403, 'CSRF_FAILED');
    error(await sessions.get('oa')!.agent.post(closePath).send({}), 403, 'CSRF_FAILED');
    expect(await db.registration.findUniqueOrThrow({ where: { id: reference } })).toEqual(before);
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).status).toBe('PUBLISHED');
  });
});
