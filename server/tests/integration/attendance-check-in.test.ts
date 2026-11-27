import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createDatabaseClient } from '../../src/db/client.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { readConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

// F-08 TEST-55 / AC-43: exercise public HTTP and the real migrated DB.
// No new attendance router/service import: RED must expose missing behaviour,
// not a missing module, type or migration.
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url, 1), reader = createDatabaseClient(url, 1);
const ids = { oa: randomUUID(), pa: randomUUID(), pb: randomUUID(), pc: randomUUID() };
const eventIds: string[] = [];
const password = randomBytes(24).toString('hex');
const t0 = Date.parse('2026-11-06T03:00:00.000Z');
const T1 = t0 + 3 * 3_600_000, T2 = T1 + 5 * 60_000;
let clock = T1;
let runtime: Awaited<ReturnType<typeof createApp>>;
let owner: ReturnType<typeof request.agent>, csrf: string;

async function fixture() {
  const id = randomUUID(); eventIds.push(id);
  const event = await db.event.create({ data: {
    id, organizerId: ids.oa, title: 'F-08 TEST-55 synthetic event',
    description: 'Isolated check-in rule test', location: 'Synthetic room', capacity: 5,
    status: 'PUBLISHED', registrationClosesAt: new Date(t0 + 3_600_000),
    startsAt: new Date(t0 + 2 * 3_600_000), endsAt: new Date(t0 + 4 * 3_600_000),
    createdAt: new Date(t0 - 1_000), updatedAt: new Date(t0 - 1_000),
  } });
  const registeredAt = new Date(t0);
  const cancelledAt = new Date(t0 + 30 * 60_000);
  const records = {} as Record<'pa' | 'pb' | 'pc', string>;
  for (const account of ['pa', 'pb', 'pc'] as const) {
    const cancelled = account === 'pc';
    const record = await db.registration.create({ data: {
      eventId: id, participantId: ids[account], status: cancelled ? 'CANCELLED' : 'ACTIVE',
      registeredAt, cancelledAt: cancelled ? cancelledAt : null,
      history: { create: [
        { actorId: ids[account], action: 'REGISTERED', occurredAt: registeredAt },
        ...(cancelled ? [{ actorId: ids[account], action: 'CANCELLED' as const, occurredAt: cancelledAt }] : []),
      ] },
    } });
    records[account] = record.id;
  }
  return { event, records };
}

function checkIn(eventId: string, registrationId: string) {
  return owner.post(`/api/organizer/events/${eventId}/registrations/${registrationId}/check-in`)
    .set('X-CSRF-Token', csrf).send({});
}

function error(response: request.Response, code: string) {
  expect(response.status).toBe(409);
  expect(response.body).toEqual({ error: { code, message: expect.any(String), fields: {} } });
}

async function snapshot(eventId: string) {
  // A distinct Prisma connection observes committed DB state, not the writer's
  // in-memory fixture or response. Snapshot every field and lifecycle history.
  return {
    event: await reader.event.findUniqueOrThrow({ where: { id: eventId } }),
    records: await reader.registration.findMany({ where: { eventId }, orderBy: { id: 'asc' } }),
    history: await reader.registrationHistory.findMany({ where: { registration: { eventId } }, orderBy: { id: 'asc' } }),
    checkedInCount: await reader.registration.count({ where: { eventId, status: 'ACTIVE', checkedInAt: { not: null } } }),
  };
}

async function roster(eventId: string) {
  return (await owner.get(`/api/organizer/events/${eventId}/registrations`).expect(200)).body.data;
}

beforeAll(async () => {
  expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: Object.entries(ids).map(([account, id]) => ({
    id, username: `f08-${id}`, passwordHash, displayName: account.toUpperCase(),
    role: account === 'oa' ? 'ORGANIZER' as const : 'PARTICIPANT' as const,
  })) });
  runtime = await createApp(readConfig({ DATABASE_URL: url, NODE_ENV: 'test',
    APP_ORIGIN: 'http://127.0.0.1:5173', SESSION_SECRET: randomBytes(48).toString('hex') }), db, () => clock);
  owner = request.agent(runtime.app);
  const pre = (await owner.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  await owner.post('/api/auth/login').set('X-CSRF-Token', pre)
    .send({ username: `f08-${ids.oa}`, password }).expect(200);
  csrf = (await owner.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
});

afterEach(async () => {
  try {
    await db.$transaction(async tx => {
      await tx.registrationHistory.deleteMany({ where: { registration: { eventId: { in: eventIds } } } });
      await tx.registration.deleteMany({ where: { eventId: { in: eventIds } } });
      await tx.event.deleteMany({ where: { id: { in: eventIds } } });
    });
  } finally { eventIds.length = 0; clock = T1; }
});

afterAll(async () => {
  try {
    if (runtime) await runtime.close();
    await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  } finally { await Promise.all([db.$disconnect(), reader.$disconnect()]); }
});

describe('F-08 check-in rule / TEST-55 / AC-43', () => {
  it('TEST-55(a): refuses CANCELLED during the event without changing data or history', async () => {
    const { event, records } = await fixture();
    const before = await snapshot(event.id);
    expect(before.records.find(r => r.id === records.pc)).toMatchObject({ status: 'CANCELLED', checkedInAt: null, checkedInById: null });
    expect(before.checkedInCount).toBe(0);
    error(await checkIn(event.id, records.pc), 'REGISTRATION_NOT_ACTIVE');
    expect(await snapshot(event.id)).toEqual(before);
    expect((await roster(event.id)).checked_in_count).toBe(0);
  });

  it('TEST-55(b): first check-in at T1 succeeds; repeat at T2 keeps T1, actor, count and history', async () => {
    const { event, records } = await fixture();
    const before = await snapshot(event.id);
    const first = await checkIn(event.id, records.pa);
    expect(first.status).toBe(200);
    expect(first.body.data).toMatchObject({ id: records.pa, checked_in_at: new Date(T1).toISOString() });
    const afterFirst = await snapshot(event.id);
    expect(afterFirst.checkedInCount).toBe(1);
    expect(afterFirst.event).toEqual(before.event);
    expect(afterFirst.history).toEqual(before.history);
    const oldRow = before.records.find(r => r.id === records.pa)!;
    expect(afterFirst.records.find(r => r.id === records.pa)).toEqual({ ...oldRow, checkedInAt: new Date(T1), checkedInById: ids.oa });
    expect(afterFirst.records.filter(r => r.id !== records.pa)).toEqual(before.records.filter(r => r.id !== records.pa));
    expect(first.body.data).not.toHaveProperty('checked_in_by_id');
    const firstRoster = await roster(event.id);
    expect(firstRoster.checked_in_count).toBe(1);
    expect(firstRoster.registrations.find((r: { id: string }) => r.id === records.pa))
      .toMatchObject({ checked_in_at: new Date(T1).toISOString() });

    clock = T2;
    error(await checkIn(event.id, records.pa), 'ALREADY_CHECKED_IN');
    expect(await snapshot(event.id)).toEqual(afterFirst);
    const repeatedRoster = await roster(event.id);
    expect(repeatedRoster.checked_in_count).toBe(1);
    expect(repeatedRoster.registrations.find((r: { id: string }) => r.id === records.pa))
      .toMatchObject({ checked_in_at: new Date(T1).toISOString() });
  });

  it('TEST-55(c): outside the time window takes precedence over CANCELLED and preserves every field', async () => {
    const { event, records } = await fixture();
    const before = await snapshot(event.id);
    clock = event.endsAt.getTime() + 1;
    error(await checkIn(event.id, records.pc), 'CHECK_IN_NOT_OPEN');
    expect(await snapshot(event.id)).toEqual(before);
    expect((await roster(event.id)).checked_in_count).toBe(0);
  });
});
