import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createDatabaseClient } from '../../src/db/client.js';
import { createApp } from '../../src/app.js';
import { readConfig } from '../../src/config/env.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { hashPassword } from '../../src/modules/accounts/password.js';

const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL), db = createDatabaseClient(url);
const password = randomBytes(24).toString('hex'), users = Array.from({ length: 5 }, () => randomUUID());
const [owner, otherOwner, participant, otherParticipant, emptyParticipant] = users;
const events = Array.from({ length: 3 }, () => randomUUID()), references = Array.from({ length: 3 }, () => randomUUID()).sort();
const time = new Date('2026-11-06T03:00:00.000Z');
const clock = () => Date.parse('2026-11-07T03:00:00.000Z');
const config = readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173' });
let runtime: Awaited<ReturnType<typeof createApp>>;
async function login(id: string) {
  const agent = request.agent(runtime.app);
  const csrf = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  const response = await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({ username: `views-${id}`, password }).expect(200);
  const cookie = (response.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  return { agent, cookie, token };
}
function error(response: request.Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String), fields: {} } });
}
beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  await db.user.createMany({ data: users.map((id, index) => ({ id, username: `views-${id}`, passwordHash,
    displayName: `Synthetic ${index}`, role: index < 2 ? 'ORGANIZER' : 'PARTICIPANT' })) });
  for (const [index, id] of events.entries()) await db.event.create({ data: { id, organizerId: index === 2 ? otherOwner : owner,
    title: `Views fixture ${index}`, description: 'Private read tests', location: 'Campus', capacity: 3,
    startsAt: new Date('2099-01-01T03:00:00Z'), endsAt: new Date('2099-01-01T04:00:00Z'), registrationClosesAt: new Date('2099-01-01T02:00:00Z'), status: index === 1 ? 'DRAFT' : 'PUBLISHED' } });
  await db.registration.createMany({ data: [
    { id: references[0], eventId: events[0], participantId: participant, registeredAt: time },
    { id: references[1], eventId: events[2], participantId: participant, registeredAt: time },
    { id: references[2], eventId: events[0], participantId: otherParticipant, registeredAt: time, status: 'CANCELLED' },
  ] });
  runtime = await createApp(config, db, clock);
});
afterAll(async () => {
  if (runtime) await runtime.close();
  try {
    await db.registration.deleteMany({ where: { eventId: { in: events } } });
    await db.event.deleteMany({ where: { id: { in: events } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
  } finally { await db.$disconnect(); }
});

it('TEST-22: persists own list/detail with exact schemas, scope and timestamp/id order', async () => {
  const { agent } = await login(participant);
  const list = (await agent.get('/api/my/registrations').expect(200)).body.data;
  expect(list.map((record: { id: string }) => record.id)).toEqual(references.slice(0, 2));
  for (const record of list) {
    expect(Object.keys(record).sort()).toEqual(['event', 'id', 'registered_at', 'status']);
    expect(Object.keys(record.event).sort()).toEqual(['ends_at', 'id', 'location', 'registration_closes_at', 'starts_at', 'status', 'title']);
    expect(record.registered_at).toBe(time.toISOString());
    expect((await agent.get(`/api/my/registrations/${record.id}`).expect(200)).body.data).toEqual(record);
  }
  await db.registration.update({ where: { id: references[1] }, data: { registeredAt: new Date(time.getTime() + 1) } });
  try {
    const ordered = (await agent.get('/api/my/registrations').expect(200)).body.data;
    expect(ordered.map((record: { id: string }) => record.id)).toEqual([references[1], references[0]]);
  } finally { await db.registration.update({ where: { id: references[1] }, data: { registeredAt: time } }); }
  const { agent: empty } = await login(emptyParticipant);
  expect((await empty.get('/api/my/registrations').expect(200)).body.data).toEqual([]);
});
it('TEST-23/27/32: enforces auth → role → input → ownership without private data', async () => {
  const pa = await login(participant), oa = await login(owner), ob = await login(otherOwner);
  const ownPaths = ['/api/my/registrations', `/api/my/registrations/${references[0]}`];
  const roster = `/api/organizer/events/${events[0]}/registrations`;
  for (const path of [...ownPaths, roster]) error(await request(runtime.app).get(path), 401, 'AUTH_REQUIRED');
  for (const path of ownPaths) error(await oa.agent.get(path), 403, 'ROLE_FORBIDDEN');
  error(await pa.agent.get(`/api/my/registrations/${references[2]}`), 404, 'REGISTRATION_NOT_FOUND');
  error(await pa.agent.get(`/api/my/registrations/${randomUUID()}`), 404, 'REGISTRATION_NOT_FOUND');
  error(await pa.agent.get('/api/my/registrations/invalid'), 400, 'INVALID_INPUT');
  error(await oa.agent.get('/api/my/registrations/invalid'), 403, 'ROLE_FORBIDDEN');
  error(await ob.agent.get(roster), 404, 'EVENT_NOT_FOUND');
  error(await pa.agent.get(roster), 403, 'ROLE_FORBIDDEN');
  error(await oa.agent.get('/api/organizer/events/invalid/registrations'), 400, 'INVALID_INPUT');
  error(await oa.agent.get(`/api/organizer/events/${randomUUID()}/registrations`), 404, 'EVENT_NOT_FOUND');
});
it('TEST-26/28/29: owner-only roster is sorted, minimal, empty for DRAFT and fresh after registration', async () => {
  const oa = await login(owner), pa = await login(emptyParticipant);
  const path = `/api/organizer/events/${events[0]}/registrations`;
  const initial = (await oa.agent.get(path).expect(200)).body.data;
  expect(Object.keys(initial).sort()).toEqual(['active_count', 'capacity', 'event_id', 'registrations']);
  expect(initial.active_count).toBe(1);
  expect(initial.registrations.map((row: { id: string }) => row.id)).toEqual([references[0], references[2]]);
  for (const row of initial.registrations) {
    expect(Object.keys(row).sort()).toEqual(['id', 'participant', 'registered_at', 'status']);
    expect(Object.keys(row.participant)).toEqual(['display_name']);
  }
  expect((await oa.agent.get(`/api/organizer/events/${events[1]}/registrations`).expect(200)).body.data)
    .toEqual({ event_id: events[1], capacity: 3, active_count: 0, registrations: [] });
  const registered = (await pa.agent.post(`/api/events/${events[0]}/registrations`).set('X-CSRF-Token', pa.token).send({}).expect(201)).body.data;
  const updated = (await oa.agent.get(path).expect(200)).body.data;
  expect(updated.active_count).toBe(await db.registration.count({ where: { eventId: events[0], status: 'ACTIVE' } }));
  expect(updated.active_count).toBe(2);
  expect(updated.registrations.at(-1)).toEqual({ id: registered.id, participant: { display_name: 'Synthetic 4' }, status: 'ACTIVE', registered_at: registered.registered_at });
  const list = (await pa.agent.get('/api/my/registrations').expect(200)).body.data;
  expect(list[0].id).toBe(registered.id);
});
it('TEST-24: own reference survives logout/re-login and app recreation', async () => {
  const pa = await login(participant);
  const path = `/api/my/registrations/${references[0]}`;
  const before = (await pa.agent.get(path).expect(200)).body;
  await pa.agent.post('/api/auth/logout').set('X-CSRF-Token', pa.token).send({}).expect(204);
  error(await pa.agent.get(path), 401, 'AUTH_REQUIRED');
  const signedIn = await login(participant);
  await runtime.close(); runtime = await createApp(config, db, clock);
  expect((await request(runtime.app).get(path).set('Cookie', signedIn.cookie).expect(200)).body).toEqual(before);
});
