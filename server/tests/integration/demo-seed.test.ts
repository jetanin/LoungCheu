import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import { createDatabaseClient } from '../../src/db/client.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { readConfig } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { seedUsers } from '../../src/modules/accounts/seed.js';
import { demoEventIds, seedDemoEvents } from '../../prisma/demo-data.js';

const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL), db = createDatabaseClient(url);
const password = randomBytes(24).toString('hex'), now = new Date('2026-11-06T16:30:00.123Z');
const ids = Object.values(demoEventIds);
let runtime: Awaited<ReturnType<typeof createApp>>, ownsFixtures = false;
async function login(username: string) {
  const agent = request.agent(runtime.app);
  const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
  const identity = (await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username, password }).expect(200)).body.data;
  const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
  return { agent, token, identity };
}
beforeAll(async () => {
  if (await db.event.count({ where: { id: { in: ids } } })) throw new Error('Demo seed test namespace is occupied; preserving existing test data');
  ownsFixtures = true;
  await seedUsers(db, password);
  runtime = await createApp(readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173' }), db, () => now.getTime());
});
afterEach(async () => {
  if (!ownsFixtures) return;
  await db.registration.deleteMany({ where: { eventId: { in: ids } } });
  await db.event.deleteMany({ where: { id: { in: ids } } });
});
afterAll(async () => { if (runtime) await runtime.close(); await db.$disconnect(); });

it('seeds six Bangkok scenarios with real availability, scoped browsing and a working registration', async () => {
  expect(await seedDemoEvents(db, now)).toEqual({ createdEvents: 6, createdRegistrations: 4, skippedEvents: 0 });
  const oa = await login('organizer.a'), ob = await login('organizer.b'), pa = await login('participant.a');
  const shared = (await pa.agent.get('/api/events').expect(200)).body.data.filter((e: { id: string }) => ids.includes(e.id as typeof ids[number]));
  expect(shared).toHaveLength(5);
  expect(shared.find((e: { id: string }) => e.id === demoEventIds.open)).toMatchObject({ status: 'PUBLISHED', capacity: 3, active_count: 1, available_seats: 2, registration_open: true,
    starts_at: '2026-11-13T02:00:00.000Z', ends_at: '2026-11-13T05:00:00.000Z', registration_closes_at: '2026-11-12T11:00:00.000Z' });
  expect(shared.find((e: { id: string }) => e.id === demoEventIds.full)).toMatchObject({ active_count: 2, available_seats: 0, registration_open: false });
  expect(shared.find((e: { id: string }) => e.id === demoEventIds.expired)).toMatchObject({ status: 'PUBLISHED', registration_open: false });
  expect(shared.find((e: { id: string }) => e.id === demoEventIds.closed)).toMatchObject({ status: 'CLOSED', active_count: 1, registration_open: false });
  await pa.agent.get(`/api/events/${demoEventIds.draft}`).expect(404);
  expect((await oa.agent.get(`/api/organizer/events/${demoEventIds.draft}`).expect(200)).body.data.status).toBe('DRAFT');
  await oa.agent.get(`/api/organizer/events/${demoEventIds.otherOwner}`).expect(404);
  expect((await ob.agent.get(`/api/organizer/events/${demoEventIds.otherOwner}`).expect(200)).body.data.organizer_id).toBe(ob.identity.id);
  const registration = (await pa.agent.post(`/api/events/${demoEventIds.open}/registrations`).set('X-CSRF-Token', pa.token).send({}).expect(201)).body.data;
  expect(await db.registration.findUniqueOrThrow({ where: { id: registration.id } })).toMatchObject({ eventId: demoEventIds.open, participantId: pa.identity.id, status: 'ACTIVE' });
  for (const event of await db.event.findMany({ where: { id: { in: ids } }, include: { registrations: true } })) {
    expect(event.registrationClosesAt.getTime()).toBeLessThanOrEqual(event.startsAt.getTime());
    expect(event.startsAt.getTime()).toBeLessThan(event.endsAt.getTime());
    expect(event.registrations.length).toBeLessThanOrEqual(event.capacity);
    for (const r of event.registrations) expect(r.registeredAt.getTime()).toBeLessThan(event.registrationClosesAt.getTime());
  }
});

it('rerunning preserves edited events, consumed seats, references and removed examples even a month later', async () => {
  expect((await seedDemoEvents(db, now)).createdEvents).toBe(6);
  const pa = await login('participant.a');
  await pa.agent.post(`/api/events/${demoEventIds.open}/registrations`).set('X-CSRF-Token', pa.token).send({}).expect(201);
  await db.event.update({ where: { id: demoEventIds.full }, data: { title: 'ผู้ใช้แก้ข้อมูลตัวอย่าง', capacity: 3 } });
  await db.registration.deleteMany({ where: { eventId: demoEventIds.closed } });
  const snapshot = async () => ({ events: await db.event.findMany({ where: { id: { in: ids } }, orderBy: { id: 'asc' } }),
    registrations: await db.registration.findMany({ where: { eventId: { in: ids } }, orderBy: { id: 'asc' } }) });
  const before = await snapshot();
  expect(await seedDemoEvents(db, new Date(now.getTime() + 30 * 86400000))).toEqual({ createdEvents: 0, createdRegistrations: 0, skippedEvents: 6 });
  expect(await snapshot()).toEqual(before);
});

it('rejects incomplete demo accounts without adding partial event data', async () => {
  const user = await db.user.findUniqueOrThrow({ where: { username: 'participant.c' } });
  await db.user.update({ where: { id: user.id }, data: { username: `seed-test-${randomUUID()}` } });
  try {
    await expect(seedDemoEvents(db, now)).rejects.toThrow(/demo account/i);
    expect(await db.event.count({ where: { id: { in: ids } } })).toBe(0);
  } finally { await db.user.update({ where: { id: user.id }, data: { username: user.username } }); }
});

it('concurrent seed calls create each fixture once without duplicating or overfilling registrations', async () => {
  const results = await Promise.all([seedDemoEvents(db, now), seedDemoEvents(db, now)]);
  expect(results.reduce((n, r) => n + r.createdEvents, 0)).toBe(6);
  expect(results.reduce((n, r) => n + r.createdRegistrations, 0)).toBe(4);
  expect(results.reduce((n, r) => n + r.skippedEvents, 0)).toBe(6);
  expect(await db.event.count({ where: { id: { in: ids } } })).toBe(6);
  expect(await db.registration.count({ where: { eventId: { in: ids } } })).toBe(4);
});
