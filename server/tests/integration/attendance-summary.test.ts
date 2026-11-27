import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import type { EventStatus, RegistrationStatus } from '@prisma/client';
import { createDatabaseClient } from '../../src/db/client.js';
import { createApp } from '../../src/app.js';
import { readConfig } from '../../src/config/env.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { resetTestUsers } from '../../../scripts/test-fixtures.js';

// F-09 Attendance summary — Sprint 3 STS §3 (TEST-60–TEST-63, API/DB part).
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url);
const password = randomBytes(24).toString('hex'), t0 = Date.parse('2026-11-06T03:00:00.000Z');
let clock = t0;
const ids: string[] = [];
let runtime: Awaited<ReturnType<typeof createApp>>;
type Who = 'PA' | 'PB' | 'PC' | 'OA' | 'OB';
const usernames: Record<Who, string> = { PA: 'participant.a', PB: 'participant.b', PC: 'participant.c', OA: 'organizer.a', OB: 'organizer.b' };
const users = {} as Record<Who, string>;
type Session = { agent: ReturnType<typeof request.agent>; token: string };
const sessions = {} as Record<Who, Session>;

async function login(who: Who): Promise<Session> {
  const agent = request.agent(runtime.app);
  const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
  await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username: usernames[who], password }).expect(200);
  return { agent, token: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string };
}
const summary = (agent: ReturnType<typeof request.agent> | ReturnType<typeof request>, id: string) => agent.get(`/api/organizer/events/${id}/summary`);
// "error ไม่มียอดหรือข้อมูลกิจกรรม": only the error envelope comes back.
function rejected(r: request.Response, status: number, code: string) {
  expect({ status: r.status, code: r.body?.error?.code }).toEqual({ status, code });
  expect(r.body.data).toBeUndefined();
  expect(JSON.stringify(r.body)).not.toMatch(/active_count|cancelled_count|checked_in_count|attendance_rate/);
}

// STS §1 fixtures (owner, status, capacity, registrations).
// A third tuple item marks a check-in stored directly in the DB (STS §1: ESUM3 PA checked_in_at=t0+2h10m by OA).
type Kind = { owner: Who; status: EventStatus; capacity: number; registrations: [Who, RegistrationStatus, number?][] };
const kinds = {
  ESUM3: { owner: 'OA', status: 'PUBLISHED', capacity: 5, registrations: [['PA', 'ACTIVE', t0 + 7_800_000], ['PB', 'ACTIVE'], ['PC', 'CANCELLED']] },
  EOTHER3: { owner: 'OB', status: 'PUBLISHED', capacity: 5, registrations: [['PA', 'ACTIVE']] },
  ECHECK3: { owner: 'OA', status: 'PUBLISHED', capacity: 5, registrations: [['PA', 'ACTIVE'], ['PB', 'ACTIVE'], ['PC', 'CANCELLED']] },
  ELIFE3: { owner: 'OA', status: 'PUBLISHED', capacity: 5, registrations: [['PA', 'ACTIVE'], ['PB', 'ACTIVE'], ['PC', 'CANCELLED']] },
  EDRAFT3: { owner: 'OA', status: 'DRAFT', capacity: 5, registrations: [] },
} satisfies Record<string, Kind>;
const syntheticUsers: string[] = [];
async function fixture(kind: keyof typeof kinds) {
  const { owner, status, capacity, registrations } = kinds[kind] as Kind, id = randomUUID(), before = new Date(t0 - 60_000);
  ids.push(id);
  const event = await db.event.create({ data: { id, organizerId: users[owner], title: kind, description: 'Synthetic F-09 fixture', location: 'KMUTT',
    capacity, status, registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 7_200_000), endsAt: new Date(t0 + 14_400_000),
    createdAt: before, updatedAt: before } });
  for (const [who, state, checkedIn] of registrations) await db.registration.create({ data: {
    eventId: id, participantId: users[who], status: state, registeredAt: before, cancelledAt: state === 'CANCELLED' ? new Date(t0 - 30_000) : null,
    ...(checkedIn ? { checkedInAt: new Date(checkedIn), checkedInById: users[owner] } : {}),
    history: { create: [{ actorId: users[who], action: 'REGISTERED', occurredAt: before },
      ...(state === 'CANCELLED' ? [{ actorId: users[who], action: 'CANCELLED' as const, occurredAt: new Date(t0 - 30_000) }] : [])] },
  } });
  return event;
}

beforeAll(async () => {
  await resetTestUsers(db, password);
  for (const who of Object.keys(usernames) as Who[]) users[who] = (await db.user.findUniqueOrThrow({ where: { username: usernames[who] } })).id;
  const config = readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173' });
  runtime = await createApp(config, db, () => clock);
  for (const who of Object.keys(usernames) as Who[]) sessions[who] = await login(who);
});
afterEach(() => { clock = t0; });
afterAll(async () => {
  try {
    await db.$transaction([
      db.registrationHistory.deleteMany({ where: { registration: { eventId: { in: ids } } } }),
      db.registration.deleteMany({ where: { eventId: { in: ids } } }),
      db.event.deleteMany({ where: { id: { in: ids } } }),
      db.user.deleteMany({ where: { id: { in: syntheticUsers } } }),
    ]);
  } finally {
    await runtime.close();
    await db.$disconnect();
  }
});

describe('F-09 GET /api/organizer/events/{id}/summary access (TEST-63 / AC-50)', () => {
  it('rejects anonymous, participant, other organizer, unknown and malformed ids without leaking counts', async () => {
    const event = await fixture('ESUM3');
    await fixture('EOTHER3');
    rejected(await summary(request(runtime.app), event.id), 401, 'AUTH_REQUIRED');
    rejected(await summary(sessions.PA.agent, event.id), 403, 'ROLE_FORBIDDEN');
    rejected(await summary(sessions.OB.agent, event.id), 404, 'EVENT_NOT_FOUND');
    rejected(await summary(sessions.OA.agent, randomUUID()), 404, 'EVENT_NOT_FOUND');
    rejected(await summary(sessions.OA.agent, 'not-a-uuid'), 400, 'INVALID_INPUT');
  });
});

// Sessions last 2 h on the controlled clock, so moving the clock needs fresh logins.
async function at(ms: number) {
  clock = ms;
  for (const who of ['OA', 'PB', 'PC'] as Who[]) sessions[who] = await login(who);
}
// Counts straight from the DB, to compare the API with the stored state.
async function dbCounts(eventId: string) {
  const rows = await db.registration.findMany({ where: { eventId }, select: { status: true, checkedInAt: true } });
  return { active_count: rows.filter(r => r.status === 'ACTIVE').length, cancelled_count: rows.filter(r => r.status === 'CANCELLED').length,
    checked_in_count: rows.filter(r => r.status === 'ACTIVE' && r.checkedInAt).length };
}
async function ok(eventId: string) {
  const r = await summary(sessions.OA.agent, eventId).expect(200);
  return r.body.data as { event_id: string; status: string; capacity: number; active_count: number; cancelled_count: number;
    checked_in_count: number; attendance_rate: string; generated_at: string };
}

describe('F-09 counts from the current registration state (TEST-60 / AC-47)', () => {
  it('(a) ESUM3: ACTIVE 2, CANCELLED 1, checked-in 1, rate 50.00, equal to the DB', async () => {
    const event = await fixture('ESUM3');
    await at(t0 + 10_800_000);
    const data = await ok(event.id);
    expect(data).toEqual({ event_id: event.id, status: 'PUBLISHED', capacity: 5, active_count: 2, cancelled_count: 1, checked_in_count: 1,
      attendance_rate: '50.00', generated_at: new Date(clock).toISOString() });
    expect(await dbCounts(event.id)).toEqual({ active_count: 2, cancelled_count: 1, checked_in_count: 1 });
  });
  it('(b) ELIFE3: reactivate/cancel/reactivate moves counts 3/0 → 2/1 → 3/0 without counting history', async () => {
    const event = await fixture('ELIFE3');
    await at(t0 + 600_000); // before the registration deadline (t0+1h)
    const pc = sessions.PC, pb = sessions.PB;
    await pc.agent.post(`/api/events/${event.id}/registrations`).set('X-CSRF-Token', pc.token).send({}).expect(200);
    expect(await ok(event.id)).toMatchObject({ active_count: 3, cancelled_count: 0 });
    const pbRegistration = await db.registration.findFirstOrThrow({ where: { eventId: event.id, participantId: users.PB } });
    await pb.agent.post(`/api/my/registrations/${pbRegistration.id}/cancel`).set('X-CSRF-Token', pb.token).send({}).expect(200);
    expect(await ok(event.id)).toMatchObject({ active_count: 2, cancelled_count: 1 });
    await pb.agent.post(`/api/events/${event.id}/registrations`).set('X-CSRF-Token', pb.token).send({}).expect(200);
    expect(await ok(event.id)).toMatchObject({ active_count: 3, cancelled_count: 0, checked_in_count: 0, attendance_rate: '0.00' });
    expect(await dbCounts(event.id)).toEqual({ active_count: 3, cancelled_count: 0, checked_in_count: 0 });
    // PB history is REGISTERED, CANCELLED, REACTIVATED; the summary still counts PB once.
    expect(await db.registrationHistory.count({ where: { registrationId: pbRegistration.id } })).toBe(3);
  });
});

describe('F-09 attendance_rate through the API (TEST-61 API part / AC-48)', () => {
  it('ERATE3: 32 ACTIVE with 1 checked in returns "3.13" (half-up, 2-decimal string)', async () => {
    const id = randomUUID(), before = new Date(t0 - 60_000);
    ids.push(id);
    await db.event.create({ data: { id, organizerId: users.OA, title: 'ERATE3', description: 'Synthetic F-09 fixture', location: 'KMUTT',
      capacity: 32, status: 'PUBLISHED', registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 7_200_000),
      endsAt: new Date(t0 + 14_400_000), createdAt: before, updatedAt: before } });
    for (let i = 0; i < 32; i++) {
      const user = await db.user.create({ data: { username: `f09.rate.${id.slice(0, 8)}.${i}`, displayName: `Rate ${i}`, role: 'PARTICIPANT',
        passwordHash: 'synthetic-not-for-login' } });
      syntheticUsers.push(user.id);
      await db.registration.create({ data: { eventId: id, participantId: user.id, status: 'ACTIVE', registeredAt: before,
        ...(i === 0 ? { checkedInAt: new Date(t0 + 7_800_000), checkedInById: users.OA } : {}),
        history: { create: [{ actorId: user.id, action: 'REGISTERED', occurredAt: before }] } } });
    }
    const data = await ok(id);
    expect(data).toMatchObject({ capacity: 32, active_count: 32, cancelled_count: 0, checked_in_count: 1, attendance_rate: '3.13' });
    expect(typeof data.attendance_rate).toBe('string');
  });
});

describe('F-09 re-read after a change and DRAFT zeros (TEST-62 / AC-49)', () => {
  it('ECHECK3: a check-in shows on the next read (0→1, "0.00"→"50.00"), generated_at = clock; EDRAFT3 is all zero', async () => {
    const event = await fixture('ECHECK3');
    await at(t0 + 10_800_000);
    expect(await ok(event.id)).toMatchObject({ checked_in_count: 0, attendance_rate: '0.00', generated_at: new Date(clock).toISOString() });
    // Real F-08 check-in (PR #79) by the owner, inside starts_at..ends_at.
    const pa = await db.registration.findFirstOrThrow({ where: { eventId: event.id, participantId: users.PA } });
    const checkIn = await sessions.OA.agent.post(`/api/organizer/events/${event.id}/registrations/${pa.id}/check-in`)
      .set('X-CSRF-Token', sessions.OA.token).send({}).expect(200);
    expect(checkIn.body.data).toMatchObject({ id: pa.id, status: 'ACTIVE', checked_in_at: new Date(clock).toISOString() });
    await at(clock + 60_000);
    expect(await ok(event.id)).toMatchObject({ active_count: 2, checked_in_count: 1, attendance_rate: '50.00',
      generated_at: new Date(clock).toISOString() });
    const draft = await fixture('EDRAFT3');
    expect(await ok(draft.id)).toMatchObject({ status: 'DRAFT', active_count: 0, cancelled_count: 0, checked_in_count: 0, attendance_rate: '0.00' });
  });
});
