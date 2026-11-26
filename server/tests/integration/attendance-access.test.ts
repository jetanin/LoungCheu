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
const ids = { oa: randomUUID(), ob: randomUUID(), pa: randomUUID(), pb: randomUUID() };
const eventIds: string[] = [], password = randomBytes(24).toString('hex');
const t0 = Date.parse('2026-11-06T03:00:00.000Z'), clock = t0 + 3 * 3_600_000;
let runtime: Awaited<ReturnType<typeof createApp>>;
type Session = { agent: ReturnType<typeof request.agent>; csrf: string };
let sessions: Record<keyof typeof ids, Session>;

async function fixture(organizerId = ids.oa, participantId = ids.pa, checked = false) {
  const id = randomUUID(); eventIds.push(id);
  await db.event.create({ data: { id, organizerId, title: 'F-08 access fixture', description: 'Synthetic private fixture',
    location: 'Synthetic room', capacity: 5, status: 'PUBLISHED', registrationClosesAt: new Date(t0 + 3_600_000),
    startsAt: new Date(t0 + 2 * 3_600_000), endsAt: new Date(t0 + 4 * 3_600_000) } });
  return db.registration.create({ data: { eventId: id, participantId, registeredAt: new Date(t0),
    checkedInAt: checked ? new Date(clock) : null, checkedInById: checked ? organizerId : null,
    history: { create: { actorId: participantId, action: 'REGISTERED', occurredAt: new Date(t0) } } } });
}

async function snapshot() {
  return {
    events: await reader.event.findMany({ where: { id: { in: eventIds } }, orderBy: { id: 'asc' } }),
    records: await reader.registration.findMany({ where: { eventId: { in: eventIds } }, orderBy: { id: 'asc' } }),
    history: await reader.registrationHistory.findMany({ where: { registration: { eventId: { in: eventIds } } }, orderBy: { id: 'asc' } }),
  };
}

const path = (eventId: string, registrationId: string) => `/api/organizer/events/${eventId}/registrations/${registrationId}/check-in`;
function post(eventId: string, registrationId: string, session: keyof typeof ids = 'oa') {
  return sessions[session].agent.post(path(eventId, registrationId)).set('X-CSRF-Token', sessions[session].csrf);
}
async function unchanged(result: request.Response, before: Awaited<ReturnType<typeof snapshot>>, status: number, code: string) {
  expect(result.status).toBe(status);
  // Exact error envelope excludes names, registration timestamps and internal IDs.
  expect(result.body).toEqual({ error: { code, message: expect.any(String), fields: {} } });
  expect(result.body.error.message).toMatch(/[ก-๙]/);
  for (const value of [...Object.values(ids), ...Object.keys(ids).map(role => `Private ${role}`),
    ...before.events.map(event => event.id), ...before.records.map(record => record.id), new Date(clock).toISOString()]) {
    expect(result.text).not.toContain(value);
  }
  expect(await snapshot()).toEqual(before);
}

beforeAll(async () => {
  expect(await db.$queryRaw`SELECT current_database() AS name`).toEqual([{ name: 'loungcheu_test' }]);
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: Object.entries(ids).map(([role, id]) => ({ id, username: `f08-access-${id}`,
    passwordHash, displayName: `Private ${role}`, role: role.startsWith('o') ? 'ORGANIZER' as const : 'PARTICIPANT' as const })) });
  runtime = await createApp(readConfig({ DATABASE_URL: url, NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173',
    SESSION_SECRET: randomBytes(48).toString('hex') }), db, () => clock);
  sessions = {} as typeof sessions;
  for (const role of Object.keys(ids) as (keyof typeof ids)[]) {
    const agent = request.agent(runtime.app);
    const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
    await agent.post('/api/auth/login').set('X-CSRF-Token', token).send({ username: `f08-access-${ids[role]}`, password }).expect(200);
    sessions[role] = { agent, csrf: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token };
  }
});

afterEach(async () => {
  await db.$transaction(async tx => {
    await tx.registrationHistory.deleteMany({ where: { registration: { eventId: { in: eventIds } } } });
    await tx.registration.deleteMany({ where: { eventId: { in: eventIds } } });
    await tx.event.deleteMany({ where: { id: { in: eventIds } } });
  });
  eventIds.length = 0;
});

afterAll(async () => {
  try {
    if (runtime) await runtime.close();
    await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
  } finally { await Promise.all([db.$disconnect(), reader.$disconnect()]); }
});

describe('F-08 TEST-56 / AC-44 input', () => {
  it.each(['eventId', 'registrationId'] as const)('TEST-56: rejects malformed %s without mutation', async field => {
    const record = await fixture(), before = await snapshot();
    await unchanged(await post(field === 'eventId' ? 'not-a-uuid' : record.eventId,
      field === 'registrationId' ? 'not-a-uuid' : record.id).send({}), before, 400, 'INVALID_INPUT');
  });

  it.each([
    ['null', 'null'], ['array', '[]'], ['string', '"x"'],
    ['forged timestamp', JSON.stringify({ checked_in_at: new Date(clock).toISOString() })],
    ['forged status', '{"status":"ACTIVE"}'], ['oversize', JSON.stringify({ padding: 'x'.repeat(1100) })],
    ['malformed JSON', '{'], ['wrong content type', 'not-json'],
  ])('TEST-56: rejects %s body without mutation', async (label, body) => {
    const record = await fixture(), before = await snapshot();
    const result = await post(record.eventId, record.id).set('Content-Type', label === 'wrong content type' ? 'text/plain' : 'application/json').send(body);
    await unchanged(result, before, 400, 'INVALID_INPUT');
  });

  it.each(['omitted', '{}'])('TEST-56: accepts %s body and uses session owner/server clock', async kind => {
    const record = await fixture(), before = await snapshot();
    const pending = post(record.eventId, record.id);
    const result = await (kind === '{}' ? pending.send({}) : pending);
    expect(result.status).toBe(200);
    expect(result.body.data).toMatchObject({ id: record.id, checked_in_at: new Date(clock).toISOString() });
    expect(Object.keys(result.body.data).sort()).toEqual(['checked_in_at', 'id', 'participant', 'registered_at', 'status']);
    const after = await snapshot();
    expect(after.events).toEqual(before.events); expect(after.history).toEqual(before.history);
    expect(after.records).toEqual([{ ...before.records[0], checkedInAt: new Date(clock), checkedInById: ids.oa }]);
  });
});

describe('F-08 TEST-57 / AC-44, AC-45 access and privacy', () => {
  it('TEST-57: anonymous cannot check in', async () => {
    const r = await fixture(), before = await snapshot();
    await unchanged(await request(runtime.app).post(path(r.eventId, r.id)).send({}), before, 401, 'AUTH_REQUIRED');
  });
  it.each(['pa', 'pb'] as const)('TEST-57: participant %s cannot check in even with valid CSRF', async role => {
    const r = await fixture(), before = await snapshot();
    await unchanged(await post(r.eventId, r.id, role).send({}), before, 403, 'ROLE_FORBIDDEN');
  });
  it('TEST-57: another organizer cannot check in the owner event', async () => {
    const r = await fixture(), before = await snapshot();
    await unchanged(await post(r.eventId, r.id, 'ob').send({}), before, 404, 'EVENT_NOT_FOUND');
  });
  it('TEST-57: owner cannot use a registration from a different event', async () => {
    const r = await fixture(), foreign = await fixture(ids.ob, ids.pb, true), before = await snapshot();
    await unchanged(await post(r.eventId, foreign.id).send({}), before, 404, 'REGISTRATION_NOT_FOUND');
  });
  it('TEST-57: nonexistent event is masked', async () => {
    const r = await fixture(), before = await snapshot();
    await unchanged(await post(randomUUID(), r.id).send({}), before, 404, 'EVENT_NOT_FOUND');
  });
  it('TEST-57: nonexistent registration is masked', async () => {
    const r = await fixture(), before = await snapshot();
    await unchanged(await post(r.eventId, randomUUID()).send({}), before, 404, 'REGISTRATION_NOT_FOUND');
  });
  it.each(['missing', 'incorrect', 'foreign-origin'])('TEST-57: rejects %s CSRF', async kind => {
    const r = await fixture(), before = await snapshot();
    let pending = sessions.oa.agent.post(path(r.eventId, r.id));
    if (kind === 'incorrect') pending = pending.set('X-CSRF-Token', 'invalid-token');
    if (kind === 'foreign-origin') pending = pending.set('X-CSRF-Token', sessions.oa.csrf).set('Origin', 'https://foreign.example');
    await unchanged(await pending.send({}), before, 403, 'CSRF_FAILED');
  });
  it('TEST-57: another participant cannot read checked-in own detail or discover it in own list', async () => {
    const r = await fixture(ids.oa, ids.pa, true), before = await snapshot();
    await unchanged(await sessions.pb.agent.get(`/api/my/registrations/${r.id}`), before, 404, 'REGISTRATION_NOT_FOUND');
    expect((await sessions.pb.agent.get('/api/my/registrations').expect(200)).body.data).toEqual([]);
    expect(await snapshot()).toEqual(before);
  });
  it.each(['pa', 'ob'] as const)('TEST-57: %s cannot read checked-in owner roster', async role => {
    const r = await fixture(ids.oa, ids.pa, true), before = await snapshot();
    await unchanged(await sessions[role].agent.get(`/api/organizer/events/${r.eventId}/registrations`),
      before, role === 'pa' ? 403 : 404, role === 'pa' ? 'ROLE_FORBIDDEN' : 'EVENT_NOT_FOUND');
  });
});
