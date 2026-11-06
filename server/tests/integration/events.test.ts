import { beforeAll, afterAll, beforeEach, it, expect } from 'vitest';
import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { createDatabaseClient } from '../../src/db/client.js';
import { createApp, SESSION_MS } from '../../src/app.js';
import { readConfig } from '../../src/config/env.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { seedUsers } from '../../src/modules/accounts/seed.js';

const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url), pool = new Pool({ connectionString: url });
const password = randomBytes(24).toString('hex'), t0 = Date.parse('2026-11-06T03:00:00Z');
const appConfig = readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173' });
let clock = t0, runtime: Awaited<ReturnType<typeof createApp>>;
let owner: string, participant: string;
const ids: string[] = [];
const input = () => ({ title: '  กิจกรรม 🌱  ', description: ' รายละเอียด ', location: ' มจธ. ', capacity: 2,
  starts_at: '2026-11-07T10:00:00+07:00', ends_at: '2026-11-07T11:00:00+07:00', registration_closes_at: '2026-11-06T11:00:00+07:00' });
async function login(username = 'organizer.a') {
  const agent = request.agent(runtime.app);
  const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  const signedIn = await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username, password }).expect(200);
  const token = (await agent.get('/api/auth/csrf')).body.data.csrf_token as string;
  const cookie = (signedIn.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  return { agent, token, cookie, oldToken: pre };
}
function error(r: request.Response, status: number, code: string) {
  expect(r.status).toBe(status);
  expect(r.body).toEqual({ error: { code, message: expect.any(String), fields: expect.any(Object) } });
}
async function fixture(data: Record<string, unknown> = {}) {
  const id = randomUUID(); ids.push(id);
  return db.event.create({ data: { id, organizerId: owner, title: 'Fixture', description: 'Description', location: 'Bangkok', capacity: 2,
    startsAt: new Date(t0 + 7200000), endsAt: new Date(t0 + 10800000), registrationClosesAt: new Date(t0 + 3600000), createdAt: new Date(t0), ...data } });
}
beforeAll(async () => {
  await seedUsers(db, password);
  owner = (await db.user.findUniqueOrThrow({ where: { username: 'organizer.a' } })).id;
  participant = (await db.user.findUniqueOrThrow({ where: { username: 'participant.a' } })).id;
  runtime = await createApp(appConfig, db, () => clock);
});
beforeEach(() => { clock = t0; });
afterAll(async () => {
  await db.registration.deleteMany({ where: { eventId: { in: ids } } });
  await db.event.deleteMany({ where: { id: { in: ids } } });
  if (runtime) await runtime.close(); await db.$disconnect(); await pool.end();
});

it('TEST-07 creates normalized DRAFT from session and reads it back', async () => {
  const { agent, token } = await login();
  const r = await agent.post('/api/organizer/events').set('X-CSRF-Token', token).send(input()).expect(201);
  ids.push(r.body.data.id);
  expect(r.body.data).toMatchObject({ title: 'กิจกรรม 🌱', description: 'รายละเอียด', location: 'มจธ.', organizer_id: owner, status: 'DRAFT',
    starts_at: '2026-11-07T03:00:00.000Z', active_count: 0, available_seats: 2, registration_open: false });
  expect((await agent.get(`/api/organizer/events/${r.body.data.id}`).expect(200)).body).toEqual(r.body);
  expect((await db.event.findUniqueOrThrow({ where: { id: r.body.data.id } })).organizerId).toBe(owner);
});

it('TEST-08 strict schema rejects invalid fields without inserting', async () => {
  const { agent, token } = await login();
  const before = await db.event.count();
  const invalid: unknown[] = [null, [], false, 1, 'text', {}, { ...input(), organizer_id: owner }, { ...input(), status: 'PUBLISHED' }];
  for (const key of Object.keys(input())) { const body: Record<string, unknown> = { ...input() }; delete body[key]; invalid.push(body); }
  for (const value of [0, -1, 1.5, 1001, '2', true, null]) invalid.push({ ...input(), capacity: value });
  for (const key of ['title', 'description', 'location']) {
    for (const value of ['', ' \t\n ', 2, true, null, [], {}]) invalid.push({ ...input(), [key]: value });
  }
  for (const [key, max] of [['title', 120], ['description', 2000], ['location', 200]] as const) invalid.push({ ...input(), [key]: '🌱'.repeat(max + 1) });
  for (const value of ['2026-11-07T10:00:00', '2026-11-07T10:00:00.0001Z', '2026-02-30T10:00:00Z', '2026-11-07T24:00:00Z', '2026-11-07T10:00:00+24:00', 123, null]) invalid.push({ ...input(), starts_at: value });
  invalid.push({ ...input(), ends_at: input().starts_at }, { ...input(), registration_closes_at: input().ends_at });
  for (const key of ['id', 'owner', 'owner_id', 'created_at', 'updated_at', 'active_count', 'available_seats', 'registration_open']) invalid.push({ ...input(), [key]: 'spoofed' });
  for (const body of invalid) error(await agent.post('/api/organizer/events').set('X-CSRF-Token', token).set('Content-Type', 'application/json').send(JSON.stringify(body)), 400, 'INVALID_INPUT');
  error(await agent.post('/api/organizer/events').set('X-CSRF-Token', token).set('Content-Type', 'application/json').send('{'), 400, 'INVALID_INPUT');
  error(await agent.post('/api/organizer/events').set('X-CSRF-Token', token).type('text').send('bad'), 400, 'INVALID_INPUT');
  expect(await db.event.count()).toBe(before);
});

it('TEST-08/36 accepts Unicode boundaries, capacities, fractions, equal closes/start and past DRAFT', async () => {
  const { agent, token } = await login();
  for (const [index, fraction] of ['', '.1', '.12', '.123'].entries()) {
    const body = { ...input(), title: ` ${'🌱'.repeat(120)} `, description: 'ก'.repeat(2000), location: '🌱'.repeat(200), capacity: index % 2 ? 1000 : 1,
      registration_closes_at: `2020-01-01T07:00:00${fraction}+07:00`, starts_at: `2020-01-01T00:00:00${fraction}Z`, ends_at: '2020-01-01T01:00:00Z' };
    const r = await agent.post('/api/organizer/events').set('X-CSRF-Token', token).send(body).expect(201); ids.push(r.body.data.id);
    expect(r.body.data.starts_at).toBe(new Date(body.starts_at).toISOString());
    expect(r.body.data.registration_closes_at).toBe(r.body.data.starts_at);
  }
});

it('TEST-09 publishes and becomes shared with exactly the contracted public fields', async () => {
  const event = await fixture(); const { agent, token } = await login();
  const r = await agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', token).send({}).expect(200);
  expect(r.body.data).toMatchObject({ status: 'PUBLISHED', organizer_id: owner, registration_open: true });
  const shared = (await agent.get(`/api/events/${event.id}`).expect(200)).body.data;
  expect(Object.keys(shared).sort()).toEqual(['id', 'title', 'description', 'location', 'capacity', 'starts_at', 'ends_at', 'registration_closes_at', 'status', 'active_count', 'available_seats', 'registration_open'].sort());
  expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).status).toBe('PUBLISHED');
});

it('TEST-10/36 status precedes deadline; rejects deadline equality and +1ms, permits -1ms', async () => {
  const { agent, token } = await login();
  for (const status of ['DRAFT', 'PUBLISHED', 'CLOSED'] as const) for (const delta of [-1, 0, 1]) {
    const event = await fixture({ status, registrationClosesAt: new Date(t0 - delta) });
    const r = await agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', token).expect(status === 'DRAFT' && delta < 0 ? 200 : 409);
    if (r.status === 409) {
      error(r, 409, status === 'DRAFT' ? 'DEADLINE_PASSED' : 'INVALID_TRANSITION');
      expect(await db.event.findUnique({ where: { id: event.id } })).toEqual(event);
    }
  }
});

it('TEST-10 rereads clock after waiting for Event row lock; concurrent publish changes status once', async () => {
  const event = await fixture(); const { agent, token } = await login();
  const blocker = await pool.connect();
  try {
    await blocker.query('BEGIN'); await blocker.query('SELECT id FROM events WHERE id=$1 FOR UPDATE', [event.id]);
    const pending = agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', token).send({}).then(r => r);
    // Wait for the real backend lock wait, rather than guessing with a sleep.
    let waiting = false;
    for (let i = 0; i < 100 && !waiting; i++) {
      waiting = !!(await pool.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE '%FOR UPDATE%' AND pid<>pg_backend_pid() ")).rowCount;
      if (!waiting) await new Promise(resolve => setTimeout(resolve, 10));
    }
    expect(waiting).toBe(true); clock = event.registrationClosesAt.getTime();
    await blocker.query('COMMIT'); error(await pending, 409, 'DEADLINE_PASSED');
  } finally { await blocker.query('ROLLBACK'); blocker.release(); }
  clock = t0;
  const results = await Promise.all([1, 2].map(() => agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', token).send({})));
  expect(results.map(r => r.status).sort()).toEqual([200, 409]);
  error(results.find(r => r.status === 409)!, 409, 'INVALID_TRANSITION');
});

it('TEST-11 shared visibility, real ACTIVE counts, availability and both sorting tie breaks', async () => {
  const { agent } = await login('participant.a'); const own = await login();
  const otherId = (await db.user.findUniqueOrThrow({ where: { username: 'organizer.b' } })).id;
  const draft = await fixture(), full = await fixture({ status: 'PUBLISHED', capacity: 1 }), closed = await fixture({ status: 'CLOSED', organizerId: otherId });
  const expired = await fixture({ status: 'PUBLISHED', registrationClosesAt: new Date(t0) });
  await db.registration.create({ data: { eventId: full.id, participantId: participant, registeredAt: new Date(t0) } });
  await db.registration.create({ data: { eventId: closed.id, participantId: participant, registeredAt: new Date(t0), status: 'CANCELLED' } });
  error(await agent.get(`/api/events/${draft.id}`), 404, 'EVENT_NOT_FOUND');
  const list = (await agent.get('/api/events').expect(200)).body.data as Record<string, any>[];
  expect(list.some(e => e.id === draft.id)).toBe(false);
  expect(list.find(e => e.id === full.id)).toMatchObject({ active_count: 1, available_seats: 0, registration_open: false });
  expect(list.find(e => e.id === closed.id)).toMatchObject({ active_count: 0, available_seats: 2, registration_open: false });
  expect(list.find(e => e.id === expired.id)?.registration_open).toBe(false);
  expect(list.map(e => e.id)).toEqual([...list].sort((a,b) => a.starts_at.localeCompare(b.starts_at) || a.id.localeCompare(b.id)).map(e => e.id));
  const owned = (await own.agent.get('/api/organizer/events').expect(200)).body.data as Record<string, any>[];
  expect(owned.every(e => e.organizer_id === owner)).toBe(true);
  expect(owned.some(e => e.id === draft.id)).toBe(true);
  expect(owned.map(e => e.id)).toEqual([...owned].sort((a,b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id)).map(e => e.id));
});

it('TEST-11/36 availability uses server clock at deadline -1ms/equality/+1ms', async () => {
  const event = await fixture({ status: 'PUBLISHED', registrationClosesAt: new Date(t0) });
  const { agent } = await login('participant.a');
  for (const delta of [-1, 0, 1]) {
    clock = t0 + delta;
    const r = await agent.get(`/api/events/${event.id}`).expect(200);
    expect(r.body.data.registration_open).toBe(delta < 0);
    expect(r.body.data).toMatchObject({ active_count: 0, available_seats: 2, status: 'PUBLISHED' });
  }
});

it('TEST-11 fields/counts use committed snapshots during concurrent capacity/registration commits', async () => {
  const event = await fixture({ status: 'PUBLISHED', capacity: 1 });
  const { agent } = await login('participant.a');
  // Both committed states have exactly one seat available: (capacity=1,count=0)
  // and (capacity=2,count=1). A mixed snapshot would report 0 or 2 seats.
  const writer = async () => {
    for (let i = 0; i < 16; i++) await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM events WHERE id=${event.id}::uuid FOR UPDATE`;
      if (i % 2 === 0) {
        await tx.event.update({ where: { id: event.id }, data: { capacity: 2 } });
        await tx.registration.create({ data: { eventId: event.id, participantId: participant, registeredAt: new Date(t0) } });
      } else {
        await tx.registration.deleteMany({ where: { eventId: event.id } });
        await tx.event.update({ where: { id: event.id }, data: { capacity: 1 } });
      }
    });
  };
  const reader = async () => {
    for (let i = 0; i < 16; i++) {
      const detail = (await agent.get(`/api/events/${event.id}`).expect(200)).body.data;
      const list = (await agent.get('/api/events').expect(200)).body.data.find((e: { id: string }) => e.id === event.id);
      for (const value of [detail, list]) {
        expect(value.capacity - value.active_count).toBe(1);
        expect(value.available_seats).toBe(1); expect(value.registration_open).toBe(true);
      }
    }
  };
  await Promise.all([writer(), reader()]);
});

it('TEST-12/13 auth → role → CSRF → input → scope and session ownership', async () => {
  const event = await fixture(); const pa = await login('participant.a'), ob = await login('organizer.b'), oa = await login();
  for (const path of ['/api/events', `/api/events/${event.id}`, '/api/organizer/events', `/api/organizer/events/${event.id}`]) error(await request(runtime.app).get(path), 401, 'AUTH_REQUIRED');
  for (const path of ['/api/organizer/events', '/api/organizer/events/bad/publish']) {
    error(await request(runtime.app).post(path).type('json').send('{'), 401, 'AUTH_REQUIRED');
    error(await pa.agent.post(path).type('json').send('{'), 403, 'ROLE_FORBIDDEN');
    for (const token of ['', 'wrong']) error(await oa.agent.post(path).set('X-CSRF-Token', token).type('json').send('{'), 403, 'CSRF_FAILED');
  }
  error(await oa.agent.post(`/api/organizer/events/${event.id}/publish`).send({}), 403, 'CSRF_FAILED');
  for (const body of [null, [], false, 1, 'text', { owner: owner }]) error(await oa.agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', oa.token).type('json').send(JSON.stringify(body)), 400, 'INVALID_INPUT');
  error(await oa.agent.post('/api/organizer/events/bad/publish').set('X-CSRF-Token', oa.token).send({}), 400, 'INVALID_INPUT');
  error(await ob.agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', ob.token).send({ status: 'spoofed' }), 400, 'INVALID_INPUT');
  for (const path of ['/api/organizer/events', `/api/organizer/events/${event.id}`]) error(await pa.agent.get(path), 403, 'ROLE_FORBIDDEN');
  error(await ob.agent.get(`/api/organizer/events/${event.id}`), 404, 'EVENT_NOT_FOUND');
  error(await ob.agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', ob.token).send({}), 404, 'EVENT_NOT_FOUND');
  for (const path of ['/api/events/bad', '/api/organizer/events/bad']) error(await oa.agent.get(path), 400, 'INVALID_INPUT');
  error(await oa.agent.get(`/api/events/${randomUUID()}`), 404, 'EVENT_NOT_FOUND');
  error(await oa.agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', oa.token).send({ status: 'PUBLISHED' }), 400, 'INVALID_INPUT');
  error(await oa.agent.post('/api/organizer/events').set('X-CSRF-Token', oa.token).set('Origin', 'https://evil.test').send(input()), 403, 'CSRF_FAILED');
  expect(await db.event.findUnique({ where: { id: event.id } })).toEqual(event);
});

it('TEST-08/36 validates every timestamp field and normalizes leap-day instants with negative offsets', async () => {
  const { agent, token } = await login(); const before = await db.event.count();
  for (const key of ['starts_at', 'ends_at', 'registration_closes_at']) for (const value of [
    '2026-02-29T10:00:00Z', '1900-02-29T10:00:00Z', '2026-04-31T10:00:00Z', '2026-11-07T10:00:00.1234+07:00',
    '2026-11-07T10:00:00+00:60', '2026-11-07T10:00:60Z', '2026-11-07T10:00:00', null, true, [], {},
  ]) error(await agent.post('/api/organizer/events').set('X-CSRF-Token', token).send({ ...input(), [key]: value }), 400, 'INVALID_INPUT');
  expect(await db.event.count()).toBe(before);
  const r = await agent.post('/api/organizer/events').set('X-CSRF-Token', token).send({ ...input(), starts_at: '2028-02-29T00:30:00.123+07:00',
    ends_at: '2028-02-28T13:30:00.123-05:00', registration_closes_at: '2028-02-28T12:30:00.123-05:00' }).expect(201);
  ids.push(r.body.data.id);
  expect(r.body.data).toMatchObject({ starts_at: '2028-02-28T17:30:00.123Z', ends_at: '2028-02-28T18:30:00.123Z', registration_closes_at: '2028-02-28T17:30:00.123Z' });
});

it('TEST-11 checks exact OwnerEvent fields on list/detail and CLOSED SharedEvent detail for both roles', async () => {
  const event = await fixture({ status: 'CLOSED' }); const oa = await login(), pa = await login('participant.a');
  const publicFields = ['id', 'title', 'description', 'location', 'capacity', 'starts_at', 'ends_at', 'registration_closes_at', 'status', 'active_count', 'available_seats', 'registration_open'];
  const ownerFields = [...publicFields, 'organizer_id', 'created_at', 'updated_at'].sort();
  const detail = (await oa.agent.get(`/api/organizer/events/${event.id}`).expect(200)).body.data;
  expect(Object.keys(detail).sort()).toEqual(ownerFields);
  const list = (await oa.agent.get('/api/organizer/events').expect(200)).body.data;
  for (const item of list) expect(Object.keys(item).sort()).toEqual(ownerFields);
  for (const signedIn of [oa, pa]) {
    const shared = (await signedIn.agent.get(`/api/events/${event.id}`).expect(200)).body.data;
    expect(Object.keys(shared).sort()).toEqual(publicFields.sort());
    expect(shared).toMatchObject({ status: 'CLOSED', registration_open: false });
  }
});

it('TEST-12/13 event endpoints use current role/active state, rotated CSRF and absolute session expiry', async () => {
  const event = await fixture(), oa = await login(), pa = await login('participant.a');
  error(await oa.agent.post('/api/organizer/events').set('X-CSRF-Token', oa.oldToken).send(input()), 403, 'CSRF_FAILED');
  try {
    await db.user.update({ where: { id: owner }, data: { role: 'PARTICIPANT' } });
    error(await oa.agent.get('/api/organizer/events'), 403, 'ROLE_FORBIDDEN');
    error(await oa.agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', oa.token).send({}), 403, 'ROLE_FORBIDDEN');
    await oa.agent.get('/api/events').expect(200);
    await db.user.update({ where: { id: participant }, data: { isActive: false } });
    error(await pa.agent.get('/api/events'), 401, 'AUTH_REQUIRED');
  } finally {
    await db.user.update({ where: { id: owner }, data: { role: 'ORGANIZER' } });
    await db.user.update({ where: { id: participant }, data: { isActive: true } });
  }
  clock = t0 + SESSION_MS;
  error(await oa.agent.get(`/api/organizer/events/${event.id}`), 401, 'AUTH_REQUIRED');
  error(await oa.agent.post(`/api/organizer/events/${event.id}/publish`).set('X-CSRF-Token', oa.token).send({}), 401, 'AUTH_REQUIRED');
  expect(await db.event.findUnique({ where: { id: event.id } })).toEqual(event);
});

it('TEST-07 event and session survive recreating createApp against the same PostgreSQL database', async () => {
  const { agent, token, cookie } = await login();
  const r = await agent.post('/api/organizer/events').set('X-CSRF-Token', token).send(input()).expect(201); ids.push(r.body.data.id);
  await runtime.close(); runtime = await createApp(appConfig, db, () => clock);
  const restored = await request(runtime.app).get(`/api/organizer/events/${r.body.data.id}`).set('Cookie', cookie).expect(200);
  expect(restored.body).toEqual(r.body);
});
