import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import { createApp } from '../../src/app.js';
import { createDatabaseClient } from '../../src/db/client.js';
import { readConfig } from '../../src/config/env.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { resetTestUsers } from '../../../scripts/test-fixtures.js';

// CR-01 / #85: approved contract #100, AC-07/37, TEST-08/48.
// New assertions deliberately run against the pre-change implementation first.
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url);
const password = randomBytes(24).toString('hex');
const now = Date.parse('2026-11-27T16:00:00.000Z');
const ids: string[] = [];
let runtime: Awaited<ReturnType<typeof createApp>>, owner: string;
type Session = { agent: ReturnType<typeof request.agent>; token: string };
let oa: Session, ob: Session, pa: Session;
const body = (title: unknown) => ({ title, description: 'd', location: 'l', capacity: 2,
  registration_closes_at: '2026-11-28T16:00:00.000Z',
  starts_at: '2026-11-29T16:00:00.000Z', ends_at: '2026-11-29T18:00:00.000Z' });

async function login(username: string): Promise<Session> {
  const agent = request.agent(runtime.app);
  const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username, password }).expect(200);
  const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
  return { agent, token };
}
async function create(title: unknown) {
  const response = await oa.agent.post('/api/organizer/events').set('X-CSRF-Token', oa.token).send(body(title));
  // Old code may create the record in an expected-400 case. Track it before
  // asserting so the meaningful RED run still cleans up its synthetic rows.
  if (response.status === 201) ids.push(response.body.data.id);
  return response;
}
function patch(session: Session, id: string, value: object) {
  return session.agent.patch(`/api/organizer/events/${id}`).set('X-CSRF-Token', session.token).send(value);
}
function error(response: request.Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String), fields: expect.any(Object) } });
}
function invalidTitle(response: request.Response) {
  error(response, 400, 'INVALID_INPUT');
  expect(response.body.error.fields).toEqual({ title: ['กรุณากรอก 3–120 ตัวอักษร'] });
}
async function fixture(title = 'Original title', status: 'DRAFT' | 'PUBLISHED' = 'DRAFT') {
  const id = randomUUID(); ids.push(id);
  return db.event.create({ data: { id, organizerId: owner, title, status,
    description: 'd', location: 'l', capacity: 2,
    registrationClosesAt: new Date(body(title).registration_closes_at),
    startsAt: new Date(body(title).starts_at), endsAt: new Date(body(title).ends_at),
    createdAt: new Date(now - 60_000), updatedAt: new Date(now - 60_000) } });
}

beforeAll(async () => {
  await resetTestUsers(db, password);
  owner = (await db.user.findUniqueOrThrow({ where: { username: 'organizer.a' } })).id;
  const config = readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'),
    NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173' });
  runtime = await createApp(config, db, () => now);
  oa = await login('organizer.a'); ob = await login('organizer.b'); pa = await login('participant.a');
});
afterAll(async () => {
  try {
    await db.registrationHistory.deleteMany({ where: { registration: { eventId: { in: ids } } } });
    await db.registration.deleteMany({ where: { eventId: { in: ids } } });
    await db.event.deleteMany({ where: { id: { in: ids } } });
  } finally {
    if (runtime) await runtime.close();
    await db.$disconnect();
  }
});

describe('CR-01 title validation — TEST-08/48 (AC-07/37)', () => {
  const rejected = [
    { name: 'empty', title: '' }, { name: 'whitespace', title: '   ' },
    { name: 'one code point', title: 'a' }, { name: 'two code points', title: 'ab' },
    { name: 'two after trim', title: '  ab  ' }, { name: 'two emoji / four UTF-16 units', title: '🌱🌱' },
    { name: '121 code points', title: 'a'.repeat(121) },
    { name: 'wrong type', title: 123 }, { name: 'null', title: null }, { name: 'array', title: [] },
  ];
  it.each(rejected)('TEST-08 create rejects $name without inserting', async ({ title }) => {
    const before = await db.event.count();
    const response = await create(title);
    // Check the no-write guarantee even when the old code incorrectly returns 201.
    const after = await db.event.count();
    expect({ status: response.status, eventCount: after }).toEqual({ status: 400, eventCount: before });
    invalidTitle(response);
  });
  it.each(rejected)('TEST-48 PATCH rejects $name without changing any field', async ({ title }) => {
    const original = await fixture();
    const response = await patch(oa, original.id, { title, capacity: 4 });
    const after = await db.event.findUniqueOrThrow({ where: { id: original.id } });
    expect({ status: response.status, event: after }).toEqual({ status: 400, event: original });
    invalidTitle(response);
  });

  const accepted = [
    { name: 'three ASCII', title: 'abc' }, { name: 'trimmed three', title: '  abc  ' },
    { name: 'three Thai letters', title: 'กขค' }, { name: 'three emoji', title: '🌱🌱🌱' },
    { name: 'Thai combining marks / three code points', title: 'นี่' },
    { name: '120 emoji / 240 UTF-16 units', title: '🌱'.repeat(120) },
  ];
  it.each(accepted)('TEST-08 create accepts $name and persists normalized text', async ({ title }) => {
    const response = await create(title);
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ title: title.trim(), description: 'd', location: 'l', status: 'DRAFT' });
    const saved = await db.event.findUniqueOrThrow({ where: { id: response.body.data.id } });
    expect(saved).toMatchObject({ title: title.trim(), organizerId: owner, description: 'd', location: 'l' });
    expect((await oa.agent.get(`/api/organizer/events/${saved.id}`).expect(200)).body.data.title).toBe(title.trim());
  });
  it.each(accepted)('TEST-48 PATCH accepts $name and reads it back', async ({ title }) => {
    const original = await fixture();
    const response = await patch(oa, original.id, { title });
    expect(response.status).toBe(200);
    expect((await oa.agent.get(`/api/organizer/events/${original.id}`).expect(200)).body.data.title).toBe(title.trim());
    expect(await db.event.findUniqueOrThrow({ where: { id: original.id } })).toMatchObject({
      title: title.trim(), description: original.description, location: original.location,
      capacity: original.capacity, organizerId: original.organizerId, createdAt: original.createdAt,
    });
  });

  it.each(['DRAFT', 'PUBLISHED'] as const)('TEST-48 legacy %s title stays readable and omitted-title PATCH works', async status => {
    const original = await fixture('ab', status);
    expect((await oa.agent.get(`/api/organizer/events/${original.id}`).expect(200)).body.data.title).toBe('ab');
    if (status === 'PUBLISHED') expect((await pa.agent.get(`/api/events/${original.id}`).expect(200)).body.data.title).toBe('ab');
    const response = await patch(oa, original.id, { capacity: 4 });
    expect(response.status).toBe(200);
    expect((await oa.agent.get(`/api/organizer/events/${original.id}`).expect(200)).body.data).toMatchObject({ title: 'ab', capacity: 4 });
    expect(await db.event.findUniqueOrThrow({ where: { id: original.id } })).toMatchObject({ title: 'ab', capacity: 4,
      organizerId: original.organizerId, status, createdAt: original.createdAt });
  });
  it('preserved legacy short-title publish and registration do not revalidate title', async () => {
    const original = await fixture('ab');
    await oa.agent.post(`/api/organizer/events/${original.id}/publish`).set('X-CSRF-Token', oa.token).send({}).expect(200);
    const joined = await pa.agent.post(`/api/events/${original.id}/registrations`).set('X-CSRF-Token', pa.token).send({}).expect(201);
    expect(joined.body.data).toMatchObject({ status: 'ACTIVE' });
    expect((await pa.agent.get(`/api/events/${original.id}`).expect(200)).body.data).toMatchObject({ title: 'ab', active_count: 1 });
  });

  it('TEST-08/48 keeps auth, role and CSRF ahead of short-title validation', async () => {
    const original = await fixture(), count = await db.event.count();
    for (const [path, value, method] of [
      ['/api/organizer/events', body('ab'), 'post'],
      [`/api/organizer/events/${original.id}`, { title: 'ab' }, 'patch'],
    ] as const) {
      error(await request(runtime.app)[method](path).send(value), 401, 'AUTH_REQUIRED');
      error(await pa.agent[method](path).set('X-CSRF-Token', pa.token).send(value), 403, 'ROLE_FORBIDDEN');
      error(await oa.agent[method](path).send(value), 403, 'CSRF_FAILED');
      error(await oa.agent[method](path).set('X-CSRF-Token', 'wrong').send(value), 403, 'CSRF_FAILED');
    }
    // Ownership is checked after syntactic validation: use a valid title here.
    error(await patch(ob, original.id, { title: 'Valid title' }), 404, 'EVENT_NOT_FOUND');
    expect(await db.event.count()).toBe(count);
    expect(await db.event.findUniqueOrThrow({ where: { id: original.id } })).toEqual(original);
  });
});
