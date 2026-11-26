import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createDatabaseClient } from '../../src/db/client.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { readConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url, 1), reader = createDatabaseClient(url, 1);
const ids = { oa: randomUUID(), pa: randomUUID() }, eventIds: string[] = [];
const password = randomBytes(24).toString('hex');
const t0 = Date.parse('2026-11-06T03:00:00.000Z'), hour = 3_600_000;
const starts = t0 + 2 * hour, ends = t0 + 4 * hour;
let clock = t0;
let runtime: Awaited<ReturnType<typeof createApp>>;

async function login(id: string) {
  const agent = request.agent(runtime.app);
  const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username: `f08-bound-${id}`, password }).expect(200);
  return { agent, csrf: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string };
}

async function fixture() {
  const id = randomUUID(); eventIds.push(id);
  await db.event.create({ data: { id, organizerId: ids.oa, title: 'TEST-54 synthetic event',
    description: 'Fresh boundary fixture', location: 'Synthetic room', capacity: 5, status: 'PUBLISHED',
    registrationClosesAt: new Date(t0 + hour), startsAt: new Date(starts), endsAt: new Date(ends),
    createdAt: new Date(t0), updatedAt: new Date(t0) } });
  return db.registration.create({ data: { eventId: id, participantId: ids.pa, registeredAt: new Date(t0),
    history: { create: { actorId: ids.pa, action: 'REGISTERED', occurredAt: new Date(t0) } } } });
}

async function snapshot(eventId: string) {
  return {
    event: await reader.event.findUniqueOrThrow({ where: { id: eventId } }),
    records: await reader.registration.findMany({ where: { eventId }, orderBy: { id: 'asc' } }),
    history: await reader.registrationHistory.findMany({ where: { registration: { eventId } }, orderBy: { id: 'asc' } }),
  };
}

async function verify(eventId: string, registrationId: string, expectedStatus: 200 | 409) {
  // A fresh real session at the case's clock avoids testing auth expiry instead
  // of the check-in boundary when moving several hours between workflow steps.
  const { agent, csrf } = await login(ids.oa), before = await snapshot(eventId);
  const result = await agent.post(`/api/organizer/events/${eventId}/registrations/${registrationId}/check-in`)
    .set('X-CSRF-Token', csrf).send({});
  expect(result.status).toBe(expectedStatus);
  const after = await snapshot(eventId);
  if (expectedStatus === 409) {
    expect(result.body).toEqual({ error: { code: 'CHECK_IN_NOT_OPEN',
      message: 'เช็กชื่อได้เฉพาะระหว่างเวลาเริ่มถึงเวลาสิ้นสุดกิจกรรม', fields: {} } });
    expect(after).toEqual(before);
  } else {
    expect(result.body.data).toEqual({ id: registrationId, participant: { display_name: 'Synthetic PA' }, status: 'ACTIVE',
      registered_at: before.records[0].registeredAt.toISOString(), checked_in_at: new Date(clock).toISOString() });
    expect(after.event).toEqual(before.event);
    expect(after.history).toEqual(before.history);
    expect(after.records).toEqual([{ ...before.records[0], checkedInAt: new Date(clock), checkedInById: ids.oa }]);
  }
  const roster = (await agent.get(`/api/organizer/events/${eventId}/registrations`).expect(200)).body.data;
  expect(roster.active_count).toBe(1);
  expect(roster.checked_in_count).toBe(expectedStatus === 200 ? 1 : 0);
  expect(roster.registrations[0]).toMatchObject({ id: registrationId,
    checked_in_at: expectedStatus === 200 ? new Date(clock).toISOString() : null });
}

beforeAll(async () => {
  expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: [
    { id: ids.oa, username: `f08-bound-${ids.oa}`, passwordHash, displayName: 'Synthetic OA', role: 'ORGANIZER' },
    { id: ids.pa, username: `f08-bound-${ids.pa}`, passwordHash, displayName: 'Synthetic PA', role: 'PARTICIPANT' },
  ] });
  runtime = await createApp(readConfig({ DATABASE_URL: url, NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173',
    SESSION_SECRET: randomBytes(48).toString('hex') }), db, () => clock);
});

afterEach(async () => {
  await db.$transaction(async tx => {
    await tx.registrationHistory.deleteMany({ where: { registration: { eventId: { in: eventIds } } } });
    await tx.registration.deleteMany({ where: { eventId: { in: eventIds } } });
    await tx.event.deleteMany({ where: { id: { in: eventIds } } });
  });
  eventIds.length = 0; clock = t0;
});

afterAll(async () => {
  try {
    if (runtime) await runtime.close();
    await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  } finally { await Promise.all([db.$disconnect(), reader.$disconnect()]); }
});

describe('F-08 TEST-54 / AC-42 boundaries and real F-06/F-07 workflows', () => {
  it.each([
    ['a: starts minus 1 ms', starts - 1, 409],
    ['b: starts exactly', starts, 200],
    ['c: ends exactly', ends, 200],
    ['d: ends plus 1 ms', ends + 1, 409],
  ] as const)('TEST-54(%s)', async (_label, at, status) => {
    const record = await fixture(); clock = at;
    await verify(record.eventId, record.id, status);
  });

  it('TEST-54(e): actual close API preserves the ability to check in during a CLOSED event', async () => {
    const record = await fixture(); clock = t0 + 3 * hour;
    const { agent, csrf } = await login(ids.oa);
    const closed = await agent.post(`/api/organizer/events/${record.eventId}/close`).set('X-CSRF-Token', csrf).send({}).expect(200);
    expect(closed.body.data.status).toBe('CLOSED');
    expect((await snapshot(record.eventId)).event.status).toBe('CLOSED');
    await verify(record.eventId, record.id, 200);
  });

  it.each([
    ['inside old window, before edited start', starts + 30 * 60_000, 409],
    ['edited start exactly', t0 + 3 * hour, 200],
    ['edited end exactly, after old end', t0 + 5 * hour, 200],
    ['edited end plus 1 ms', t0 + 5 * hour + 1, 409],
  ] as const)('TEST-54(f): real create -> PATCH -> publish -> register uses %s', async (_label, at, status) => {
    clock = t0;
    const { agent, csrf } = await login(ids.oa);
    const created = await agent.post('/api/organizer/events').set('X-CSRF-Token', csrf).send({
      title: 'TEST-54 edited schedule', description: 'Synthetic cross-feature workflow', location: 'Synthetic room', capacity: 5,
      registration_closes_at: new Date(t0 + hour).toISOString(), starts_at: new Date(starts).toISOString(), ends_at: new Date(ends).toISOString(),
    }).expect(201);
    const eventId = created.body.data.id as string; eventIds.push(eventId);
    expect(created.body.data.status).toBe('DRAFT');
    await agent.patch(`/api/organizer/events/${eventId}`).set('X-CSRF-Token', csrf).send({
      starts_at: new Date(t0 + 3 * hour).toISOString(), ends_at: new Date(t0 + 5 * hour).toISOString(),
    }).expect(200);
    await agent.post(`/api/organizer/events/${eventId}/publish`).set('X-CSRF-Token', csrf).send({}).expect(200);
    const participant = await login(ids.pa);
    const registered = await participant.agent.post(`/api/events/${eventId}/registrations`)
      .set('X-CSRF-Token', participant.csrf).send({}).expect(201);
    const event = (await snapshot(eventId)).event;
    expect(event).toMatchObject({ status: 'PUBLISHED', startsAt: new Date(t0 + 3 * hour), endsAt: new Date(t0 + 5 * hour) });
    clock = at;
    await verify(eventId, registered.body.data.id, status);
  });
});
