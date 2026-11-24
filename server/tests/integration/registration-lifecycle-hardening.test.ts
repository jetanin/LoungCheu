import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { EventStatus, RegistrationStatus } from '@prisma/client';
import { createDatabaseClient } from '../../src/db/client.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { readConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

// Verification of implemented F-06 behaviour (TEST-40/41/42), not a fabricated
// RED run. Every writer has a separate real PostgreSQL connection/session.
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url), a = createDatabaseClient(url, 1), b = createDatabaseClient(url, 1);
const locker = createDatabaseClient(url, 1);
const ids = { oa: randomUUID(), ob: randomUUID(), pa: randomUUID(), pb: randomUUID() };
type Account = keyof typeof ids;
type Operation = 'register' | 'cancel' | 'close';
type Session = { agent: ReturnType<typeof request.agent>; token: string };
const sessions: Map<Account, Session>[] = [new Map(), new Map()];
const runtimes: Awaited<ReturnType<typeof createApp>>[] = [];
const password = randomBytes(24).toString('hex'), t0 = Date.parse('2026-11-06T03:00:00.000Z');
const eventIds: string[] = [];
let clock = t0;

async function fixture(state: RegistrationStatus | null = null, status: EventStatus = 'PUBLISHED', deadline = t0 + 3_600_000) {
  const id = randomUUID(); eventIds.push(id);
  return db.$transaction(async tx => {
    const event = await tx.event.create({ data: {
      id, organizerId: ids.oa, title: 'F-06 hardening fixture', description: 'Synthetic data', location: 'Test room',
      capacity: 1, status, registrationClosesAt: new Date(deadline), startsAt: new Date(t0 + 7_200_000),
      endsAt: new Date(t0 + 14_400_000), createdAt: new Date(t0 - 10_800_000), updatedAt: new Date(t0 - 10_800_000),
    } });
    const record = state ? await tx.registration.create({ data: {
      eventId: id, participantId: ids.pa, status: state, registeredAt: new Date(t0 - 7_200_000),
      cancelledAt: state === 'CANCELLED' ? new Date(t0 - 3_600_000) : null,
    } }) : null;
    if (record) {
      await tx.registrationHistory.create({ data: { registrationId: record.id, actorId: ids.pa,
        action: 'REGISTERED', occurredAt: record.registeredAt } });
      if (state === 'CANCELLED') await tx.registrationHistory.create({ data: { registrationId: record.id, actorId: ids.pa,
        action: 'CANCELLED', occurredAt: record.cancelledAt! } });
    }
    return { event, record };
  });
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
function path(operation: Operation, f: Fixture, id?: string) {
  if (operation === 'cancel') return `/api/my/registrations/${id ?? f.record!.id}/cancel`;
  return operation === 'close' ? `/api/organizer/events/${id ?? f.event.id}/close` : `/api/events/${id ?? f.event.id}/registrations`;
}
function post(operation: Operation, f: Fixture, connection = 0, account: Account = operation === 'close' ? 'oa' : 'pa', id?: string) {
  const session = sessions[connection].get(account)!;
  return session.agent.post(path(operation, f, id)).set('X-CSRF-Token', session.token);
}
function error(response: request.Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String), fields: {} } });
  expect(JSON.stringify(response.body)).not.toMatch(/password_hash|csrf_token|SELECT |stack|traceback/);
}
async function snapshot(id: string) {
  return {
    event: await db.event.findUniqueOrThrow({ where: { id } }),
    registrations: await db.registration.findMany({ where: { eventId: id }, orderBy: { id: 'asc' } }),
    history: await db.registrationHistory.findMany({ where: { registration: { eventId: id } }, orderBy: { id: 'asc' } }),
  };
}

beforeAll(async () => {
  expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: (Object.keys(ids) as Account[]).map(account => ({ id: ids[account],
    username: `f06-hard-${ids[account]}`, displayName: account.toUpperCase(), passwordHash,
    role: account.startsWith('o') ? 'ORGANIZER' as const : 'PARTICIPANT' as const,
  })) });
  const config = readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'),
    APP_ORIGIN: 'http://127.0.0.1:5173', NODE_ENV: 'test' });
  for (const [index, connection] of [a, b].entries()) {
    const runtime = await createApp(config, connection, () => clock); runtimes.push(runtime);
    for (const account of Object.keys(ids) as Account[]) {
      const agent = request.agent(runtime.app);
      const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
      await agent.post('/api/auth/login').set('X-CSRF-Token', pre)
        .send({ username: `f06-hard-${ids[account]}`, password }).expect(200);
      const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
      sessions[index].set(account, { agent, token });
    }
  }
});
afterEach(async () => {
  try {
    await db.registrationHistory.deleteMany({ where: { registration: { eventId: { in: eventIds } } } });
    await db.registration.deleteMany({ where: { eventId: { in: eventIds } } });
    await db.event.deleteMany({ where: { id: { in: eventIds } } });
  } finally { eventIds.length = 0; clock = t0; }
});
afterAll(async () => {
  try {
    await Promise.all(runtimes.map(runtime => runtime.close()));
    await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  } finally { await Promise.all([db, a, b, locker].map(connection => connection.$disconnect())); }
});

// Queue writers in an observed order while a third connection owns the Event.
// This proves both lock orders instead of hoping that Promise.all schedules both.
async function waitForLocks(pids: number[]) {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const rows = await db.$queryRaw<{ pid: number }[]>`
      SELECT pid FROM pg_stat_activity WHERE pid = ANY(${pids}::int[]) AND wait_event_type = 'Lock'
    `;
    if (rows.length === pids.length) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('F-06 writers did not reach the real PostgreSQL lock barrier');
}
async function orderedRace(id: string, firstConnection: 0 | 1,
  first: () => Promise<request.Response>, second?: () => Promise<request.Response>, beforeRelease?: () => void) {
  const pids = await Promise.all([a, b].map(async connection =>
    (await connection.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`)[0].pid));
  expect(pids[0]).not.toBe(pids[1]);
  let unlock!: () => void, acquired!: () => void;
  const ready = new Promise<void>(resolve => { acquired = resolve; });
  const gate = new Promise<void>(resolve => { unlock = resolve; });
  const hold = locker.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM events WHERE id = ${id}::uuid FOR UPDATE`;
    acquired(); await gate;
  }, { timeout: 20_000 });
  await ready;
  const pending: Promise<request.Response>[] = [];
  try {
    pending.push(first()); pending[0].catch(() => undefined);
    await waitForLocks([pids[firstConnection]]);
    if (second) {
      pending.push(second()); pending[1].catch(() => undefined);
      await waitForLocks(pids);
    }
    beforeRelease?.();
  } finally {
    unlock(); await hold;
    // Always settle the HTTP requests before cleanup, including a barrier error.
    await Promise.allSettled(pending);
  }
  return Promise.all(pending);
}

describe('F-06 TEST-40 / strict input and domain precedence', () => {
  const operations: Operation[] = ['register', 'cancel', 'close'];
  const invalid = ['null', '[]', '1', 'true', '"text"', '{', '{"participant_id":"spoof"}',
    '{"status":"ACTIVE"}', '{"registered_at":"2026-01-01"}', '{"cancelled_at":null}',
    '{"event_id":"spoof"}', '{"id":"spoof"}'];
  it.each(operations)('%s rejects invalid/spoofed bodies, content types and parser overflow without side effects', async operation => {
    const f = await fixture(operation === 'cancel' ? 'ACTIVE' : null);
    const before = await snapshot(f.event.id);
    for (const body of [...invalid, JSON.stringify({ padding: 'x'.repeat(operation === 'close' ? 33_000 : 1_100) })]) {
      error(await post(operation, f).set('Content-Type', 'application/json').send(body), 400, 'INVALID_INPUT');
      expect(await snapshot(f.event.id)).toEqual(before);
    }
    error(await post(operation, f).set('Content-Type', 'text/plain').send('{}'), 400, 'INVALID_INPUT');
    for (const badId of ['not-a-uuid', '123']) {
      error(await post(operation, f, 0, operation === 'close' ? 'oa' : 'pa', badId).send({}), 400, 'INVALID_INPUT');
    }
    expect(await snapshot(f.event.id)).toEqual(before);
  });
  it.each(operations)('%s accepts absent body and {} when domain conditions allow it', async operation => {
    for (const hasBody of [false, true]) {
      const f = await fixture(operation === 'cancel' ? 'ACTIVE' : null);
      const call = post(operation, f);
      expect((await (hasBody ? call.send({}) : call)).status).toBe(operation === 'register' ? 201 : 200);
    }
  });
  it.each([-1, 0, 1])('reactivate respects deadline offset %i ms and preserves rejected state/history', async offset => {
    const f = await fixture('CANCELLED', 'PUBLISHED', t0);
    const before = await snapshot(f.event.id);
    clock = t0 + offset;
    const result = await post('register', f).send({});
    if (offset < 0) {
      expect(result.status).toBe(200);
      expect(result.body.data).toMatchObject({ id: f.record!.id, cancelled_at: null,
        registered_at: f.record!.registeredAt.toISOString() });
    } else {
      error(result, 409, 'REGISTRATION_CLOSED');
      expect(await snapshot(f.event.id)).toEqual(before);
    }
  });
  it('checks event-open before cancelled/duplicate/full, and duplicate before capacity', async () => {
    const openCancelled = await fixture('CANCELLED');
    error(await post('cancel', openCancelled).send({}), 409, 'ALREADY_CANCELLED');
    clock = openCancelled.event.registrationClosesAt.getTime();
    const beforeExpired = await snapshot(openCancelled.event.id);
    error(await post('cancel', openCancelled).send({}), 409, 'REGISTRATION_CLOSED');
    error(await post('register', openCancelled).send({}), 409, 'REGISTRATION_CLOSED');
    expect(await snapshot(openCancelled.event.id)).toEqual(beforeExpired);
    clock = t0;
    const active = await fixture('ACTIVE');
    const beforeDuplicate = await snapshot(active.event.id);
    error(await post('register', active).send({}), 409, 'ALREADY_REGISTERED');
    expect(await snapshot(active.event.id)).toEqual(beforeDuplicate);
    const full = await fixture('CANCELLED');
    expect((await post('register', full, 0, 'pb').send({})).status).toBe(201);
    const beforeFull = await snapshot(full.event.id);
    error(await post('register', full).send({}), 409, 'EVENT_FULL');
    expect(await snapshot(full.event.id)).toEqual(beforeFull);
    for (const status of ['DRAFT', 'CLOSED'] as const) {
      const f = await fixture('ACTIVE', status, t0 - 1);
      const before = await snapshot(f.event.id);
      error(await post('register', f).send({}), status === 'DRAFT' ? 404 : 409,
        status === 'DRAFT' ? 'EVENT_NOT_FOUND' : 'REGISTRATION_CLOSED');
      error(await post('close', f).send({}), 409, 'INVALID_TRANSITION');
      expect(await snapshot(f.event.id)).toEqual(before);
    }
  });
});

describe('F-06 TEST-41 / error schema and permission precedence', () => {
  it.each(['register', 'cancel', 'close'] as Operation[])('%s checks auth → role → CSRF/Origin → input → scope', async operation => {
    const f = await fixture('ACTIVE'), before = await snapshot(f.event.id);
    const badPath = path(operation, f, 'not-a-uuid');
    const allowed = operation === 'close' ? 'oa' : 'pa';
    const wrongRole = sessions[0].get(operation === 'close' ? 'pa' : 'oa')!;
    error(await request(runtimes[0].app).post(badPath).set('Content-Type', 'application/json').send('{'), 401, 'AUTH_REQUIRED');
    error(await wrongRole.agent.post(badPath).set('Content-Type', 'application/json').send('{'), 403, 'ROLE_FORBIDDEN');
    const session = sessions[0].get(allowed)!;
    error(await session.agent.post(badPath).set('Content-Type', 'application/json').send('{'), 403, 'CSRF_FAILED');
    error(await session.agent.post(badPath).set('X-CSRF-Token', sessions[0].get('pb')!.token).send({}), 403, 'CSRF_FAILED');
    error(await post(operation, f).set('Origin', 'https://outside.example').send({}), 403, 'CSRF_FAILED');
    error(await post(operation, f, 0, allowed, randomUUID()).send({}), 404,
      operation === 'cancel' ? 'REGISTRATION_NOT_FOUND' : 'EVENT_NOT_FOUND');
    if (operation !== 'register') {
      const foreign = operation === 'close' ? 'ob' : 'pb';
      const rejection = await post(operation, f, 0, foreign).send({});
      error(rejection, 404, operation === 'close' ? 'EVENT_NOT_FOUND' : 'REGISTRATION_NOT_FOUND');
      expect(JSON.stringify(rejection.body)).not.toContain(f.record!.id);
      error(await post(operation, f, 0, foreign).send({ status: 'spoof' }), 400, 'INVALID_INPUT');
    }
    expect(await snapshot(f.event.id)).toEqual(before);
  });
});

describe('F-06 TEST-42 / observed PostgreSQL lock races', () => {
  it('double cancel: one transition/history entry (20 fresh rounds, alternating connection order)', async () => {
    for (let round = 0; round < 20; round++) {
      const f = await fixture('ACTIVE'), first = (round % 2) as 0 | 1, second = (1 - first) as 0 | 1;
      const results = await orderedRace(f.event.id, first,
        async () => post('cancel', f, first).send({}), async () => post('cancel', f, second).send({}));
      expect(results[0].status).toBe(200); error(results[1], 409, 'ALREADY_CANCELLED');
      const saved = await snapshot(f.event.id);
      expect(saved.registrations).toHaveLength(1);
      expect(saved.registrations[0]).toMatchObject({ id: f.record!.id, status: 'CANCELLED', cancelledAt: new Date(t0) });
      expect(saved.history.map(row => row.action).sort()).toEqual(['CANCELLED', 'REGISTERED']);
      expect(saved.event.updatedAt).toEqual(f.event.updatedAt);
    }
  }, 60_000);
  it('double reactivate: one transition/history entry (20 fresh rounds, alternating connection order)', async () => {
    for (let round = 0; round < 20; round++) {
      const f = await fixture('CANCELLED'), first = (round % 2) as 0 | 1, second = (1 - first) as 0 | 1;
      const results = await orderedRace(f.event.id, first,
        async () => post('register', f, first).send({}), async () => post('register', f, second).send({}));
      expect(results[0].status).toBe(200); error(results[1], 409, 'ALREADY_REGISTERED');
      const saved = await snapshot(f.event.id);
      expect(saved.registrations).toHaveLength(1);
      expect(saved.registrations[0]).toMatchObject({ id: f.record!.id, status: 'ACTIVE', cancelledAt: null, registeredAt: f.record!.registeredAt });
      expect(saved.history).toHaveLength(3);
      expect(saved.history.filter(row => row.action === 'REACTIVATED')).toHaveLength(1);
    }
  }, 60_000);
  it('reactivate vs new registration: exactly one last-seat winner (20 fresh rounds, both orders)', async () => {
    for (let round = 0; round < 20; round++) {
      const f = await fixture('CANCELLED'), reactivateFirst = round % 2 === 0;
      const first = reactivateFirst ? 0 : 1;
      const reactivate = async () => post('register', f, 0, 'pa').send({});
      const create = async () => post('register', f, 1, 'pb').send({});
      const results = await orderedRace(f.event.id, first, reactivateFirst ? reactivate : create, reactivateFirst ? create : reactivate);
      expect(results[0].status).toBe(reactivateFirst ? 200 : 201); error(results[1], 409, 'EVENT_FULL');
      const saved = await snapshot(f.event.id), winner = saved.registrations.filter(row => row.status === 'ACTIVE');
      expect(winner).toHaveLength(1); expect(winner[0].participantId).toBe(reactivateFirst ? ids.pa : ids.pb);
      expect(saved.registrations.filter(row => row.participantId === ids.pa)).toHaveLength(1);
      const original = saved.registrations.find(row => row.id === f.record!.id)!;
      expect(original.registeredAt).toEqual(f.record!.registeredAt);
      if (!reactivateFirst) expect(original).toMatchObject({ status: 'CANCELLED', cancelledAt: f.record!.cancelledAt });
      expect(saved.history).toHaveLength(3);
      expect(saved.event.capacity).toBeGreaterThanOrEqual(winner.length);
    }
  }, 60_000);
  it.each(['create', 'reactivate', 'cancel'] as const)('close vs %s: committed order is preserved (20 fresh rounds, both orders)', async kind => {
    for (let round = 0; round < 20; round++) {
      const f = await fixture(kind === 'create' ? null : kind === 'reactivate' ? 'CANCELLED' : 'ACTIVE');
      const before = await snapshot(f.event.id), closeFirst = round % 2 === 0;
      const closing = async () => post('close', f, 0, 'oa').send({});
      const mutation = async () => post(kind === 'cancel' ? 'cancel' : 'register', f, 1, 'pa').send({});
      const results = await orderedRace(f.event.id, closeFirst ? 0 : 1,
        closeFirst ? closing : mutation, closeFirst ? mutation : closing);
      if (closeFirst) { expect(results[0].status).toBe(200); error(results[1], 409, 'REGISTRATION_CLOSED'); }
      else { expect(results[0].status).toBe(kind === 'create' ? 201 : 200); expect(results[1].status).toBe(200); }
      const saved = await snapshot(f.event.id);
      expect(saved.event.status).toBe('CLOSED');
      if (closeFirst) {
        expect(saved.registrations).toEqual(before.registrations); expect(saved.history).toEqual(before.history);
      } else {
        expect(saved.registrations).toHaveLength(1);
        expect(saved.registrations[0].status).toBe(kind === 'cancel' ? 'CANCELLED' : 'ACTIVE');
        expect(saved.history).toHaveLength(before.history.length + 1);
        if (f.record) expect(saved.registrations[0].id).toBe(f.record.id);
      }
      expect(saved.registrations.filter(row => row.status === 'ACTIVE').length).toBeLessThanOrEqual(saved.event.capacity);
    }
  }, 60_000);
  it.each(['cancel', 'reactivate'] as const)('%s reads clock after a deadline-crossing lock wait (20 fresh rounds)', async kind => {
    for (let round = 0; round < 20; round++) {
      clock = t0;
      const f = await fixture(kind === 'cancel' ? 'ACTIVE' : 'CANCELLED', 'PUBLISHED', t0 + 1);
      const before = await snapshot(f.event.id);
      const results = await orderedRace(f.event.id, 0,
        async () => post(kind === 'cancel' ? 'cancel' : 'register', f).send({}), undefined,
        () => { clock = t0 + 1; });
      error(results[0], 409, 'REGISTRATION_CLOSED');
      expect(await snapshot(f.event.id)).toEqual(before);
    }
  }, 60_000);
});
