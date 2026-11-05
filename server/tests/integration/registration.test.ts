import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type PrismaClient, type EventStatus } from '../../src/generated/prisma/client.js';
import { createDatabaseClient } from '../../src/db/client.js';
import request from 'supertest';
import { createRegistrationApp } from '../../src/app.js';
import { createRegistrationService } from '../../src/modules/registrations/service.js';
import { ApiError } from '../../src/shared/errors.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !decodeURIComponent(new URL(databaseUrl).pathname).endsWith('_test')) {
  throw new Error('Set TEST_DATABASE_URL to a dedicated PostgreSQL database whose name ends in _test.');
}
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
const t0 = new Date('2026-11-06T03:00:00.000Z');
let now = t0;

async function fixture(capacity = 2, status: EventStatus = 'PUBLISHED', closes = new Date(t0.getTime() + 3_600_000)) {
  const id = randomUUID();
  eventIds.push(id);
  return db.event.create({ data: {
    id, organizer_id: ownerId, title: 'Synthetic registration test', description: 'Test fixture', location: 'Campus',
    capacity, status, registration_closes_at: closes,
    starts_at: new Date(t0.getTime() + 7_200_000), ends_at: new Date(t0.getTime() + 14_400_000),
  } });
}

function app(connection: PrismaClient, participantId: string | null = participantA, role: 'PARTICIPANT' | 'ORGANIZER' = 'PARTICIPANT') {
  return createRegistrationApp({
    // Test-only guard injection isolates #3 from #1. No runtime login bypass is shipped.
    authenticate: async (_req, res, next) => {
      if (participantId) {
        const user = await db.user.findUnique({ where: { id: participantId } });
        res.locals.identity = user ? { id: user.id, role, is_active: user.is_active } : undefined;
      }
      next();
    },
    verifyCsrf: (req, _res, next) => next(req.get('X-CSRF-Token') === 'test-token' &&
      (!req.get('Origin') || req.get('Origin') === 'http://localhost:5173') ? undefined
      : new ApiError(403, 'CSRF_FAILED', 'CSRF failed')),
    register: createRegistrationService(connection, () => now),
  });
}
function post(application: ReturnType<typeof app>, id: string) {
  return request(application).post(`/api/events/${id}/registrations`).set('X-CSRF-Token', 'test-token');
}

beforeAll(async () => {
  await Promise.all([db.$connect(), a.$connect(), b.$connect(), locker.$connect()]);
  await db.user.createMany({ data: [
    { id: ownerId, username: `test-${ownerId}`, password_hash: 'unused-test-only', display_name: 'OA', role: 'ORGANIZER' },
    ...[participantA, participantB].map((id, index) => ({ id, username: `test-${id}`, password_hash: 'unused-test-only', display_name: `P${index}`, role: 'PARTICIPANT' as const })),
  ] });
});
afterEach(async () => {
  await db.registration.deleteMany({ where: { event_id: { in: eventIds } } });
  await db.event.deleteMany({ where: { id: { in: eventIds } } });
  eventIds.length = 0;
  now = t0;
});
afterAll(async () => {
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
    await tx.$queryRaw`SELECT "id" FROM "Event" WHERE "id" = ${id}::uuid FOR UPDATE`;
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
    expect(record.participant_id).toBe(participantA);
    expect(record.registered_at).toEqual(t0);
  });
  it.each([1, 2])('rejects duplicate with unchanged record at capacity %i (TEST-16)', async (capacity) => {
    const event = await fixture(capacity);
    const first = await post(app(a), event.id).send({});
    now = new Date(t0.getTime() + 1);
    const duplicate = await post(app(b), event.id).send({});
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('ALREADY_REGISTERED');
    const records = await db.registration.findMany({ where: { event_id: event.id } });
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(first.body.data.id);
    expect(records[0].registered_at).toEqual(t0);
  });
  it('rejects full event without inserting a loser (TEST-17)', async () => {
    const event = await fixture(1);
    await post(app(a, participantB), event.id).send({});
    const response = await post(app(b), event.id).send({});
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EVENT_FULL');
    expect(await db.registration.count({ where: { event_id: event.id } })).toBe(1);
  });
  it.each(['DRAFT', 'CLOSED'] as const)('rejects %s before duplicate/full checks (TEST-18)', async (status) => {
    const event = await fixture(1, status);
    await db.registration.create({ data: { event_id: event.id, participant_id: participantA, registered_at: t0 } });
    const response = await post(app(a), event.id).send({});
    expect(response.status).toBe(status === 'DRAFT' ? 404 : 409);
    expect(response.body.error.code).toBe(status === 'DRAFT' ? 'EVENT_NOT_FOUND' : 'REGISTRATION_CLOSED');
    expect(await db.registration.count({ where: { event_id: event.id } })).toBe(1);
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
    expect(await db.registration.count({ where: { event_id: event.id } })).toBe(offset < 0 ? 1 : 0);
  });
  it('checks deadline ahead of duplicate/full for expired PUBLISHED (TEST-18)', async () => {
    const event = await fixture(1, 'PUBLISHED', t0);
    await db.registration.create({ data: { event_id: event.id, participant_id: participantA, registered_at: new Date(t0.getTime() - 1) } });
    const response = await post(app(a), event.id).send({});
    expect(response.body.error.code).toBe('REGISTRATION_CLOSED');
    expect(await db.registration.count({ where: { event_id: event.id } })).toBe(1);
  });
  it('rejects role, missing identity, CSRF, Origin, and spoofing without DB writes (TEST-19)', async () => {
    const event = await fixture();
    expect((await post(app(a, null), event.id).send({})).status).toBe(401);
    expect((await post(app(a, ownerId, 'ORGANIZER'), event.id).send({})).status).toBe(403);
    expect((await request(app(a)).post(`/api/events/${event.id}/registrations`).send({})).status).toBe(403);
    expect((await post(app(a), event.id).set('Origin', 'https://other.example').send({})).status).toBe(403);
    for (const body of [{ participant_id: participantB }, { status: 'ACTIVE' }, { registered_at: t0 }]) {
      expect((await post(app(a), event.id).send(body)).status).toBe(400);
    }
    expect(await db.registration.count({ where: { event_id: event.id } })).toBe(0);
  });
  it('rejects when clock crosses deadline while waiting for the lock (TEST-18)', async () => {
    const event = await fixture(1, 'PUBLISHED', new Date(t0.getTime() + 1));
    let response: request.Response | undefined;
    await race(event.id, 1, async () => { response = await post(app(a), event.id).send({}); },
      () => { now = new Date(t0.getTime() + 1); });
    expect(response!.status).toBe(409);
    expect(response!.body.error.code).toBe('REGISTRATION_CLOSED');
    expect(await db.registration.count({ where: { event_id: event.id } })).toBe(0);
  });
  it('allocates exactly one last seat across separate connections (TEST-20)', async () => {
    const event = await fixture(1);
    let responses: request.Response[] = [];
    await race(event.id, 2, async () => {
      responses = await Promise.all([post(app(a), event.id).send({}), post(app(b, participantB), event.id).send({})]);
    });
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)!.body.error.code).toBe('EVENT_FULL');
    const records = await db.registration.findMany({ where: { event_id: event.id } });
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
    expect(await db.registration.count({ where: { event_id: event.id } })).toBe(1);
  });
});
