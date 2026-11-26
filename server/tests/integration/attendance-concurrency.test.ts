import { randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool, type PoolClient } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createDatabaseClient } from '../../src/db/client.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { readConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL), suite = randomUUID();
const namedUrl = (side: string) => { const value = new URL(url); value.searchParams.set('application_name', `f08-${suite}-${side}`); return value.toString(); };
const db = createDatabaseClient(url, 1), reader = createDatabaseClient(url, 1);
const writers = [createDatabaseClient(namedUrl('A'), 1), createDatabaseClient(namedUrl('B'), 1)];
const control = new Pool({ connectionString: namedUrl('barrier'), max: 3 });
const ids = { owner: randomUUID(), participant: randomUUID() }, eventIds: string[] = [];
const t0 = Date.parse('2026-11-06T03:00:00.000Z'), T1 = t0 + 3 * 3_600_000, T2 = T1 + 5 * 60_000;
const clocks = [T1, T2], password = randomBytes(24).toString('hex');
const runtimes: Awaited<ReturnType<typeof createApp>>[] = [];
const sessions: { agent: ReturnType<typeof request.agent>; csrf: string }[] = [];

async function fixture() {
  const id = randomUUID(); eventIds.push(id);
  await db.event.create({ data: { id, organizerId: ids.owner, title: 'TEST-58 synthetic event',
    description: 'Isolated real PostgreSQL lock race', location: 'Synthetic room', capacity: 5, status: 'PUBLISHED',
    registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 2 * 3_600_000), endsAt: new Date(t0 + 4 * 3_600_000),
    createdAt: new Date(t0), updatedAt: new Date(t0) } });
  return db.registration.create({ data: { eventId: id, participantId: ids.participant, registeredAt: new Date(t0),
    history: { create: { actorId: ids.participant, action: 'REGISTERED', occurredAt: new Date(t0) } } } });
}

async function snapshot(eventId: string) {
  return {
    event: await reader.event.findUniqueOrThrow({ where: { id: eventId } }),
    records: await reader.registration.findMany({ where: { eventId }, orderBy: { id: 'asc' } }),
    history: await reader.registrationHistory.findMany({ where: { registration: { eventId } }, orderBy: { id: 'asc' } }),
    count: await reader.registration.count({ where: { eventId, status: 'ACTIVE', checkedInAt: { not: null } } }),
  };
}

function start(side: number, eventId: string, registrationId: string) {
  // Supertest is lazy: .then starts the HTTP request before observing DB waits.
  const pending = sessions[side].agent.post(`/api/organizer/events/${eventId}/registrations/${registrationId}/check-in`)
    .set('X-CSRF-Token', sessions[side].csrf).send({}).then(response => response);
  void pending.catch(() => {}); // Always awaited/drained by the caller's finally.
  return pending;
}

async function waitForEventLock(side: number) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await control.query<{ pid: number; blockers: number[] }>(`
      SELECT pid, pg_blocking_pids(pid) AS blockers FROM pg_stat_activity
      WHERE datname=current_database() AND application_name=$1
        AND wait_event_type='Lock' AND query LIKE '%FROM events%' AND query LIKE '%FOR UPDATE%'
        AND cardinality(pg_blocking_pids(pid)) > 0
    `, [`f08-${suite}-${side === 0 ? 'A' : 'B'}`]);
    if (result.rows.length) return result.rows[0];
    await delay(10);
  }
  throw new Error(`Runtime ${side} did not reach the observed Event lock barrier`);
}

async function holdEvent(eventId: string) {
  const blocker = await control.connect();
  try {
    await blocker.query('BEGIN');
    await blocker.query('SELECT id FROM events WHERE id=$1::uuid FOR UPDATE', [eventId]);
    return blocker;
  } catch (error) { await blocker.query('ROLLBACK'); blocker.release(); throw error; }
}

async function releaseAndDrain(blocker: PoolClient, pending: Promise<request.Response>[]) {
  try { await blocker.query('ROLLBACK'); }
  finally { blocker.release(); await Promise.allSettled(pending); }
}

beforeAll(async () => {
  expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
  const passwordHash = await hashPassword(password), sessionSecret = randomBytes(48).toString('hex');
  await db.user.createMany({ data: [
    { id: ids.owner, username: `f08-race-${ids.owner}`, passwordHash, displayName: 'Synthetic OA', role: 'ORGANIZER' },
    { id: ids.participant, username: `f08-race-${ids.participant}`, passwordHash, displayName: 'Synthetic PA', role: 'PARTICIPANT' },
  ] });
  for (let side = 0; side < 2; side++) {
    const config = readConfig({ DATABASE_URL: namedUrl(side === 0 ? 'A' : 'B'), NODE_ENV: 'test',
      APP_ORIGIN: 'http://127.0.0.1:5173', SESSION_SECRET: sessionSecret });
    const runtime = await createApp(config, writers[side], () => clocks[side]); runtimes.push(runtime);
    const agent = request.agent(runtime.app);
    const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
    await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username: `f08-race-${ids.owner}`, password }).expect(200);
    sessions.push({ agent, csrf: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token });
  }
});

afterEach(async () => {
  await db.$transaction(async tx => {
    await tx.registrationHistory.deleteMany({ where: { registration: { eventId: { in: eventIds } } } });
    await tx.registration.deleteMany({ where: { eventId: { in: eventIds } } });
    await tx.event.deleteMany({ where: { id: { in: eventIds } } });
  });
  eventIds.length = 0; clocks[0] = T1; clocks[1] = T2;
});

afterAll(async () => {
  try {
    await Promise.all(runtimes.map(runtime => runtime.close()));
    await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  } finally { await Promise.all([db.$disconnect(), reader.$disconnect(), ...writers.map(writer => writer.$disconnect()), control.end()]); }
});

describe('F-08 TEST-58 / AC-46 real PostgreSQL concurrency', () => {
  it.each(Array.from({ length: 20 }, (_, index) => index + 1))('TEST-58(a): round %i keeps the winning runtime timestamp across concurrent requests', async round => {
    const record = await fixture(), before = await snapshot(record.eventId);
    const first = (round - 1) % 2, second = 1 - first;
    const blocker = await holdEvent(record.eventId), pending: Promise<request.Response>[] = [];
    try {
      pending[first] = start(first, record.eventId, record.id);
      const firstWait = await waitForEventLock(first);
      pending[second] = start(second, record.eventId, record.id);
      const secondWait = await waitForEventLock(second);
      expect(firstWait.pid).not.toBe(secondWait.pid);
      await blocker.query('COMMIT');
      const responses = await Promise.all(pending);
      expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
      expect(responses[first].status).toBe(200); // Alternate the real lock queue: 10 wins each.
      expect(responses[second].body).toEqual({ error: { code: 'ALREADY_CHECKED_IN', message: 'ผู้เข้าร่วมคนนี้เช็กชื่อแล้ว', fields: {} } });
      const stamp = new Date(clocks[first]);
      expect(responses[first].body.data).toEqual({ id: record.id, participant: { display_name: 'Synthetic PA' },
        status: 'ACTIVE', registered_at: new Date(t0).toISOString(), checked_in_at: stamp.toISOString() });
      const after = await snapshot(record.eventId);
      expect(after.event).toEqual(before.event); expect(after.history).toEqual(before.history);
      expect(after.records).toEqual([{ ...before.records[0], checkedInAt: stamp, checkedInById: ids.owner }]);
      expect(after.count).toBe(1);
      const roster = (await sessions[first].agent.get(`/api/organizer/events/${record.eventId}/registrations`).expect(200)).body.data;
      expect(roster.checked_in_count).toBe(1);
      expect(roster.registrations).toEqual([responses[first].body.data]);
      console.info('F08_RACE', JSON.stringify({ round, first: first === 0 ? 'A' : 'B', winner: first === 0 ? 'A' : 'B',
        statuses: responses.map(response => response.status), timestamp: stamp.toISOString(), count: after.count,
        distinctWriterPids: [firstWait.pid, secondWait.pid] }));
    } finally { await releaseAndDrain(blocker, pending); }
  });

  it('TEST-58(b): request waiting on Event lock rereads clock and rejects after ends+1 ms', async () => {
    const record = await fixture(), before = await snapshot(record.eventId);
    const blocker = await holdEvent(record.eventId), pending: Promise<request.Response>[] = [];
    try {
      pending.push(start(0, record.eventId, record.id));
      const waiting = await waitForEventLock(0);
      expect(clocks[0]).toBe(T1);
      clocks[0] = before.event.endsAt.getTime() + 1;
      await blocker.query('COMMIT');
      const result = await pending[0];
      expect(result.status).toBe(409);
      expect(result.body).toEqual({ error: { code: 'CHECK_IN_NOT_OPEN', message: 'เช็กชื่อได้เฉพาะระหว่างเวลาเริ่มถึงเวลาสิ้นสุดกิจกรรม', fields: {} } });
      expect(await snapshot(record.eventId)).toEqual(before);
      const roster = (await sessions[0].agent.get(`/api/organizer/events/${record.eventId}/registrations`).expect(200)).body.data;
      expect(roster.checked_in_count).toBe(0);
      expect(roster.registrations[0].checked_in_at).toBeNull();
      console.info('F08_LOCK_CLOCK', JSON.stringify({ writerPid: waiting.pid, queuedAt: new Date(T1).toISOString(),
        releasedAt: new Date(clocks[0]).toISOString(), status: result.status, code: result.body.error.code, unchanged: true }));
    } finally { await releaseAndDrain(blocker, pending); }
  });
});
