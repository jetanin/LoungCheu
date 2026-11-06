import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type PrismaClient, type EventStatus } from '@prisma/client';
import { createDatabaseClient } from '../../src/db/client.js';
import request from 'supertest';
import { createApp, SESSION_MS } from '../../src/app.js';
import { readConfig } from '../../src/config/env.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

const databaseUrl = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
function client() {
  return createDatabaseClient(databaseUrl!, 1);
}
const db = client();
const a = client();
const b = client();
const locker = client();
const ownerId = randomUUID();
const participantA = randomUUID();
const participantB = randomUUID();
const eventIds: string[] = [];
type Agent = ReturnType<typeof request.agent>;
const agents = new Map<PrismaClient, Map<string | null, Agent>>();
const tokens = new WeakMap<Agent, string>();
const runtimes: Awaited<ReturnType<typeof createApp>>[] = [];
const password = randomBytes(24).toString('hex');
const t0 = new Date('2026-11-06T03:00:00.000Z');
let now = t0;

async function fixture(capacity = 2, status: EventStatus = 'PUBLISHED', closes = new Date(t0.getTime() + 3_600_000)) {
  const id = randomUUID();
  eventIds.push(id);
  return db.event.create({ data: {
    id, organizerId: ownerId, title: 'Synthetic registration test', description: 'Test fixture', location: 'Campus',
    capacity, status, registrationClosesAt: closes,
    startsAt: new Date(t0.getTime() + 7_200_000), endsAt: new Date(t0.getTime() + 14_400_000),
  } });
}

function app(connection: PrismaClient, participantId: string | null = participantA) {
  return agents.get(connection)!.get(participantId)!;
}
function post(agent: Agent, id: string) {
  return agent.post(`/api/events/${id}/registrations`).set('X-CSRF-Token', tokens.get(agent) ?? 'anonymous');
}

async function freshLogin() {
  const agent = request.agent(runtimes[0].app);
  const pre = await agent.get('/api/auth/csrf').expect(200);
  await agent.post('/api/auth/login').set('X-CSRF-Token', pre.body.data.csrf_token)
    .send({ username: `test-${participantA}`, password }).expect(200);
  const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
  return { agent, token, oldToken: pre.body.data.csrf_token as string };
}

beforeAll(async () => {
  await Promise.all([db.$connect(), a.$connect(), b.$connect(), locker.$connect()]);
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: [
    { id: ownerId, username: `test-${ownerId}`, passwordHash, displayName: 'OA', role: 'ORGANIZER' },
    ...[participantA, participantB].map((id, index) => ({ id, username: `test-${id}`, passwordHash, displayName: `P${index}`, role: 'PARTICIPANT' as const })),
  ] });
  const config = readConfig({ DATABASE_URL: databaseUrl, SESSION_SECRET: randomBytes(48).toString('hex'), APP_ORIGIN: 'http://127.0.0.1:5173', NODE_ENV: 'test' });
  for (const connection of [a, b]) {
    const runtime = await createApp(config, connection, () => now.getTime());
    runtimes.push(runtime);
    const connections = new Map<string | null, Agent>();
    connections.set(null, request.agent(runtime.app));
    for (const id of [ownerId, participantA, participantB]) {
      const agent = request.agent(runtime.app);
      const pre = await agent.get('/api/auth/csrf').expect(200);
      await agent.post('/api/auth/login').set('X-CSRF-Token', pre.body.data.csrf_token)
        .send({ username: `test-${id}`, password }).expect(200);
      tokens.set(agent, (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token);
      connections.set(id, agent);
    }
    agents.set(connection, connections);
  }
});
afterEach(async () => {
  await db.registration.deleteMany({ where: { eventId: { in: eventIds } } });
  await db.event.deleteMany({ where: { id: { in: eventIds } } });
  eventIds.length = 0;
  now = t0;
});
afterAll(async () => {
  await Promise.all(runtimes.map((runtime) => runtime.close()));
  try { await db.user.deleteMany({ where: { id: { in: [ownerId, participantA, participantB] } } }); }
  finally { await Promise.all([db.$disconnect(), a.$disconnect(), b.$disconnect(), locker.$disconnect()]); }
});

// Hold the event row until all contenders are observed waiting on real PostgreSQL locks.
async function race(id: string, contenders: number, run: () => Promise<unknown>, beforeRelease?: () => void) {
  const pids = (await Promise.all([a, b].slice(0, contenders).map((c) => c.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`))).map((rows) => rows[0].pid);
  let release!: () => void;
  let locked!: () => void;
  const ready = new Promise<void>((resolve) => { locked = resolve; });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const hold = locker.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "events" WHERE "id" = ${id}::uuid FOR UPDATE`;
    locked();
    await gate;
  }, { timeout: 15_000 });
  await ready;
  const pending = run();
  try {
    const timeout = Date.now() + 8_000;
    while (true) {
      const rows = await db.$queryRaw<{ pid: number }[]>`SELECT pid FROM pg_stat_activity WHERE pid = ANY(${pids}::int[]) AND wait_event_type = 'Lock'`;
      if (rows.length === contenders) break;
      if (Date.now() >= timeout) throw new Error('Contenders did not reach PostgreSQL lock barrier');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    beforeRelease?.();
  } finally {
    release();
    await hold;
    await pending;
  }
  return pending;
}

describe('F-03 real PostgreSQL / API (TEST-15–21)', () => {
  it('persists session-owned ACTIVE and exact post-lock timestamp (TEST-15)', async () => {
    const event = await fixture();
    const response = await post(app(a), event.id).send({});
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({ id: expect.any(String), event_id: event.id, status: 'ACTIVE', registered_at: t0.toISOString() });
    const record = await db.registration.findUniqueOrThrow({ where: { id: response.body.data.id } });
    expect(record.participantId).toBe(participantA);
    expect(record.registeredAt).toEqual(t0);
  });
  it.each([1, 2])('rejects duplicate with unchanged record at capacity %i (TEST-16)', async (capacity) => {
    const event = await fixture(capacity);
    const first = await post(app(a), event.id).send({});
    now = new Date(t0.getTime() + 1);
    const duplicate = await post(app(b), event.id).send({});
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('ALREADY_REGISTERED');
    const records = await db.registration.findMany({ where: { eventId: event.id } });
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(first.body.data.id);
    expect(records[0].registeredAt).toEqual(t0);
  });
  it('rejects full event without inserting a loser (TEST-17)', async () => {
    const event = await fixture(1);
    await post(app(a, participantB), event.id).send({});
    const response = await post(app(b), event.id).send({});
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EVENT_FULL');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(1);
  });
  it.each(['DRAFT', 'CLOSED'] as const)('rejects %s before duplicate/full checks (TEST-18)', async (status) => {
    const event = await fixture(1, status);
    await db.registration.create({ data: { eventId: event.id, participantId: participantA, registeredAt: t0 } });
    const response = await post(app(a), event.id).send({});
    expect(response.status).toBe(status === 'DRAFT' ? 404 : 409);
    expect(response.body.error.code).toBe(status === 'DRAFT' ? 'EVENT_NOT_FOUND' : 'REGISTRATION_CLOSED');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(1);
  });
  it('returns 404 for a missing valid UUID (TEST-18)', async () => {
    const response = await post(app(a), randomUUID()).send({});
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('EVENT_NOT_FOUND');
  });
  it.each([-1, 0, 1])('enforces deadline at offset %i ms (TEST-18)', async (offset) => {
    const event = await fixture(1, 'PUBLISHED', t0);
    now = new Date(t0.getTime() + offset);
    const response = await post(app(a), event.id).send({});
    expect(response.status).toBe(offset < 0 ? 201 : 409);
    if (offset >= 0) expect(response.body.error.code).toBe('REGISTRATION_CLOSED');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(offset < 0 ? 1 : 0);
  });
  it('checks deadline ahead of duplicate/full for expired PUBLISHED (TEST-18)', async () => {
    const event = await fixture(1, 'PUBLISHED', t0);
    await db.registration.create({ data: { eventId: event.id, participantId: participantA, registeredAt: new Date(t0.getTime() - 1) } });
    const response = await post(app(a), event.id).send({});
    expect(response.body.error.code).toBe('REGISTRATION_CLOSED');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(1);
  });
  it('rejects role, missing identity, CSRF, Origin, and spoofing without DB writes (TEST-19)', async () => {
    const event = await fixture();
    expect((await post(app(a, null), event.id).send({})).status).toBe(401);
    expect((await post(app(a, ownerId), event.id).send({})).status).toBe(403);
    expect((await app(a).post(`/api/events/${event.id}/registrations`).send({})).status).toBe(403);
    expect((await post(app(a), event.id).set('Origin', 'https://other.example').send({})).status).toBe(403);
    for (const body of [{ participant_id: participantB }, { status: 'ACTIVE' }, { registered_at: t0 }]) {
      expect((await post(app(a), event.id).send(body)).status).toBe(400);
    }
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(0);
  });
  it('rejects when clock crosses deadline while waiting for the lock (TEST-18)', async () => {
    const event = await fixture(1, 'PUBLISHED', new Date(t0.getTime() + 1));
    let response: request.Response | undefined;
    await race(event.id, 1, async () => { response = await post(app(a), event.id).send({}); },
      () => { now = new Date(t0.getTime() + 1); });
    expect(response!.status).toBe(409);
    expect(response!.body.error.code).toBe('REGISTRATION_CLOSED');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(0);
  });
  it('allocates exactly one last seat across separate connections (TEST-20)', async () => {
    const event = await fixture(1);
    let responses: request.Response[] = [];
    await race(event.id, 2, async () => {
      responses = await Promise.all([post(app(a), event.id).send({}), post(app(b, participantB), event.id).send({})]);
    });
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)!.body.error.code).toBe('EVENT_FULL');
    const records = await db.registration.findMany({ where: { eventId: event.id } });
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(responses.find((r) => r.status === 201)!.body.data.id);
  });
  it('inserts only one concurrent registration for the same participant (TEST-21)', async () => {
    const event = await fixture(2);
    let responses: request.Response[] = [];
    await race(event.id, 2, async () => {
      responses = await Promise.all([post(app(a), event.id).send({}), post(app(b), event.id).send({})]);
    });
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)!.body.error.code).toBe('ALREADY_REGISTERED');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(1);
  });
  it('uses staging token rotation and logout enforcement for registration', async () => {
    const event = await fixture();
    const { agent, token, oldToken } = await freshLogin();
    const rotated = await agent.post(`/api/events/${event.id}/registrations`).set('X-CSRF-Token', oldToken).send({});
    expect(rotated.status).toBe(403);
    expect(rotated.body.error.code).toBe('CSRF_FAILED');
    await agent.post('/api/auth/logout').set('X-CSRF-Token', token).send({}).expect(204);
    const loggedOut = await agent.post(`/api/events/${event.id}/registrations`).set('X-CSRF-Token', token).send({});
    expect(loggedOut.status).toBe(401);
    expect(loggedOut.body.error.code).toBe('AUTH_REQUIRED');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(0);
  });
  it('uses staging current-user and absolute-expiry checks before registration', async () => {
    const event = await fixture();
    const disabled = await freshLogin();
    await db.user.update({ where: { id: participantA }, data: { isActive: false } });
    try {
      const response = await disabled.agent.post(`/api/events/${event.id}/registrations`).set('X-CSRF-Token', disabled.token).send({});
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH_REQUIRED');
    } finally { await db.user.update({ where: { id: participantA }, data: { isActive: true } }); }
    const expired = await freshLogin();
    now = new Date(t0.getTime() + SESSION_MS);
    const response = await expired.agent.post(`/api/events/${event.id}/registrations`).set('X-CSRF-Token', expired.token).send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
    expect(await db.registration.count({ where: { eventId: event.id } })).toBe(0);
  });
});
