import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createDatabaseClient } from '../../src/db/client.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { readConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

// TEST-53 completes the public check-in -> roster -> own-read journey.
// Nullable own-read cases specify MyRegistrationS3; they are not TEST-59 UI coverage.
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url, 1), reader = createDatabaseClient(url, 1);
const ids = { owner: randomUUID(), participant: randomUUID() };
const password = randomBytes(24).toString('hex'), events: string[] = [];
const t0 = Date.parse('2026-11-06T03:00:00.000Z'), now = t0 + 150 * 60_000;
let runtime: Awaited<ReturnType<typeof createApp>>;
let owner: ReturnType<typeof request.agent>, csrf: string;

async function login(id: string) {
  const agent = request.agent(runtime.app);
  const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  await agent.post('/api/auth/login').set('X-CSRF-Token', token)
    .send({ username: `f08-own-${id}`, password }).expect(200);
  return { agent, csrf: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string };
}

async function fixture(cancelled = false) {
  const id = randomUUID(); events.push(id);
  await db.event.create({ data: { id, organizerId: ids.owner, title: 'F-08 TEST-53 synthetic event',
    description: 'Isolated own attendance read', location: 'Synthetic room', capacity: 3, status: 'PUBLISHED',
    registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 2 * 3_600_000),
    endsAt: new Date(t0 + 4 * 3_600_000), createdAt: new Date(t0 - 1000), updatedAt: new Date(t0 - 1000) } });
  const record = await db.registration.create({ data: { eventId: id, participantId: ids.participant,
    status: cancelled ? 'CANCELLED' : 'ACTIVE', registeredAt: new Date(t0),
    cancelledAt: cancelled ? new Date(t0 + 30 * 60_000) : null,
    history: { create: [ { actorId: ids.participant, action: 'REGISTERED', occurredAt: new Date(t0) },
      ...(cancelled ? [{ actorId: ids.participant, action: 'CANCELLED' as const, occurredAt: new Date(t0 + 30 * 60_000) }] : []) ] } } });
  return record;
}

async function snapshot(eventId: string) {
  return {
    event: await reader.event.findUniqueOrThrow({ where: { id: eventId } }),
    records: await reader.registration.findMany({ where: { eventId }, orderBy: { id: 'asc' } }),
    history: await reader.registrationHistory.findMany({ where: { registration: { eventId } }, orderBy: { id: 'asc' } }),
  };
}

async function ownReads(id: string, expected: string | null) {
  const { agent } = await login(ids.participant);
  const detail = (await agent.get(`/api/my/registrations/${id}`).expect(200)).body.data;
  const list = (await agent.get('/api/my/registrations').expect(200)).body.data;
  expect(list).toHaveLength(1);
  expect(list[0].id).toBe(id);
  expect({ detail: detail.checked_in_at, list: list[0].checked_in_at })
    .toEqual({ detail: expected, list: expected });
  expect(Object.keys(detail).sort()).toEqual(['cancelled_at', 'checked_in_at', 'event', 'id', 'registered_at', 'status']);
  expect(list[0]).toEqual(detail);
  return detail;
}

beforeAll(async () => {
  expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: Object.entries(ids).map(([role, id]) => ({ id, username: `f08-own-${id}`,
    passwordHash, displayName: `Synthetic ${role}`, role: role === 'owner' ? 'ORGANIZER' as const : 'PARTICIPANT' as const })) });
  runtime = await createApp(readConfig({ DATABASE_URL: url, NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173',
    SESSION_SECRET: randomBytes(48).toString('hex') }), db, () => now);
  const signedIn = await login(ids.owner); owner = signedIn.agent; csrf = signedIn.csrf;
});

afterEach(async () => {
  await db.$transaction(async tx => {
    await tx.registrationHistory.deleteMany({ where: { registration: { eventId: { in: events } } } });
    await tx.registration.deleteMany({ where: { eventId: { in: events } } });
    await tx.event.deleteMany({ where: { id: { in: events } } });
  });
  events.length = 0;
});

afterAll(async () => {
  try {
    if (runtime) await runtime.close();
    await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  } finally { await Promise.all([db.$disconnect(), reader.$disconnect()]); }
});

describe('F-08 own attendance / TEST-53 / MyRegistrationS3', () => {
  it('TEST-53: real check-in commits one timestamp shared by roster and own list/detail without lifecycle changes', async () => {
    const record = await fixture(), before = await snapshot(record.eventId);
    const response = await owner.post(`/api/organizer/events/${record.eventId}/registrations/${record.id}/check-in`)
      .set('X-CSRF-Token', csrf).send({}).expect(200);
    expect(response.body.data.checked_in_at).toBe(new Date(now).toISOString());
    expect(response.body.data).not.toHaveProperty('checked_in_by_id');
    const after = await snapshot(record.eventId);
    expect(after.event).toEqual(before.event);
    expect(after.history).toEqual(before.history);
    expect(after.records).toEqual([{ ...before.records[0], checkedInAt: new Date(now), checkedInById: ids.owner }]);
    const roster = (await owner.get(`/api/organizer/events/${record.eventId}/registrations`).expect(200)).body.data;
    expect(roster.checked_in_count).toBe(1);
    expect(roster.registrations).toEqual([response.body.data]);
    const own = await ownReads(record.id, new Date(now).toISOString());
    expect(own).toMatchObject({ status: 'ACTIVE', registered_at: new Date(t0).toISOString(), cancelled_at: null });
    expect(await snapshot(record.eventId)).toEqual(after);
  });

  it.each([false, true])('MyRegistrationS3: unchecked record (cancelled=%s) has required null checked_in_at in both reads', async cancelled => {
    const record = await fixture(cancelled), before = await snapshot(record.eventId);
    expect(record.checkedInAt).toBeNull();
    const own = await ownReads(record.id, null);
    expect(own.status).toBe(cancelled ? 'CANCELLED' : 'ACTIVE');
    expect(await snapshot(record.eventId)).toEqual(before);
  });
});
