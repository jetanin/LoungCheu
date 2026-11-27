import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Event, EventStatus, PrismaClient } from '@prisma/client';
import { createDatabaseClient } from '../../src/db/client.js';
import { createApp } from '../../src/app.js';
import { readConfig } from '../../src/config/env.js';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';
import { resetTestUsers } from '../../../scripts/test-fixtures.js';

// F-07 Edit event details and capacity — Sprint 2 STS §3 (TEST-45–TEST-51).
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url), a = createDatabaseClient(url, 1), b = createDatabaseClient(url, 1), locker = createDatabaseClient(url, 1);
const password = randomBytes(24).toString('hex'), t0 = Date.parse('2026-11-06T03:00:00.000Z');
let clock = t0;
const ids: string[] = [];
const runtimes: Awaited<ReturnType<typeof createApp>>[] = [];
type Who = 'PA' | 'PB' | 'PC' | 'OA' | 'OB';
const usernames: Record<Who, string> = { PA: 'participant.a', PB: 'participant.b', PC: 'participant.c', OA: 'organizer.a', OB: 'organizer.b' };
const users = {} as Record<Who, string>;
type Session = { agent: ReturnType<typeof request.agent>; token: string };
const sessions = new Map<string, Session>();

async function login(runtime: number, who: Who): Promise<Session> {
  const agent = request.agent(runtimes[runtime].app);
  const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string;
  await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username: usernames[who], password }).expect(200);
  return { agent, token: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string };
}
const as = (who: Who, runtime = 0) => sessions.get(`${runtime}:${who}`)!;
function patch(session: Session, id: string, body?: object) {
  const req = session.agent.patch(`/api/organizer/events/${id}`).set('X-CSRF-Token', session.token);
  return body === undefined ? req : req.send(body);
}
const register = (session: Session, id: string) => session.agent.post(`/api/events/${id}/registrations`).set('X-CSRF-Token', session.token).send({});
function error(r: request.Response, status: number, code: string) {
  expect({ status: r.status, code: r.body?.error?.code }).toEqual({ status, code });
}

// STS §1 fixtures. updated_at is pinned before t0 so "changed" and "unchanged" are both observable.
const kinds = {
  EDRAFT2: { status: 'DRAFT', capacity: 5, active: [] },
  EPUB2: { status: 'PUBLISHED', capacity: 3, active: ['PA', 'PB'] },
  EFULL2: { status: 'PUBLISHED', capacity: 1, active: ['PB'] },
  ECLOSED2: { status: 'CLOSED', capacity: 5, active: ['PA'] },
} satisfies Record<string, { status: EventStatus; capacity: number; active: Who[] }>;
async function fixture(kind: keyof typeof kinds, status: EventStatus = kinds[kind].status) {
  const { capacity, active } = kinds[kind], id = randomUUID(), before = new Date(t0 - 60_000);
  ids.push(id);
  const event = await db.event.create({ data: { id, organizerId: users.OA, title: kind, description: 'Synthetic F-07 fixture', location: 'KMUTT',
    capacity, status, registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 7_200_000), endsAt: new Date(t0 + 14_400_000),
    createdAt: before, updatedAt: before } });
  for (const who of active as Who[]) await db.registration.create({ data: {
    eventId: id, participantId: users[who], registeredAt: before,
    history: { create: { actorId: users[who], action: 'REGISTERED', occurredAt: before } },
  } });
  return event;
}
// F-06 × F-07 (contracts cross-feature table): ECLOSED2 starts PUBLISHED and is closed by the real F-06 endpoint.
async function closedByF06() {
  const event = await fixture('ECLOSED2', 'PUBLISHED');
  clock = t0 + 30_000;
  const r = await as('OA').agent.post(`/api/organizer/events/${event.id}/close`).set('X-CSRF-Token', as('OA').token).send({});
  expect(r.status).toBe(200);
  expect(r.body.data).toMatchObject({ id: event.id, status: 'CLOSED', capacity: 5, active_count: 1, registration_open: false,
    updated_at: new Date(t0 + 30_000).toISOString() });
  clock = t0 + 60_000; // a later clock, so a PATCH that wrongly wrote would also move updated_at
  return db.event.findUniqueOrThrow({ where: { id: event.id } });
}
// "ข้อมูลไม่เปลี่ยน": the Event row (including updated_at) and its Registrations equal the pre-request state.
async function unchanged(event: Event) {
  expect(await db.event.findUniqueOrThrow({ where: { id: event.id } })).toEqual(event);
  expect(await db.registration.count({ where: { eventId: event.id } })).toBe(kinds[event.title as keyof typeof kinds].active.length);
}

beforeAll(async () => {
  await resetTestUsers(db, password);
  for (const who of Object.keys(usernames) as Who[]) users[who] = (await db.user.findUniqueOrThrow({ where: { username: usernames[who] } })).id;
  const config = readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173' });
  for (const connection of [a, b] as PrismaClient[]) runtimes.push(await createApp(config, connection, () => clock));
  for (const runtime of [0, 1]) for (const who of Object.keys(usernames) as Who[]) sessions.set(`${runtime}:${who}`, await login(runtime, who));
});
afterEach(() => { clock = t0; });
afterAll(async () => {
  try {
    // F-06 adds Restrict history FKs: clean only this suite's records, children first.
    await db.$transaction([
      db.registrationHistory.deleteMany({ where: { registration: { eventId: { in: ids } } } }),
      db.registration.deleteMany({ where: { eventId: { in: ids } } }),
      db.event.deleteMany({ where: { id: { in: ids } } }),
    ]);
  } finally {
    await Promise.all(runtimes.map(runtime => runtime.close()));
    await Promise.all([db, a, b, locker].map(client => client.$disconnect()));
  }
});

describe('F-07 PATCH /api/organizer/events/{id} (TEST-45–TEST-51)', () => {
  it('TEST-45 / AC-34 owner edits every EventInput field of a DRAFT and reads it back', async () => {
    const event = await fixture('EDRAFT2');
    clock = t0 + 1_000;
    const r = await patch(as('OA'), event.id, { title: '  แก้ชื่อ 🌱 ', description: ' คำอธิบายใหม่ ', location: ' ห้อง 2 ', capacity: 7,
      starts_at: '2026-11-08T10:00:00+07:00', ends_at: '2026-11-08T12:30:00.5+07:00', registration_closes_at: '2026-11-08T09:00:00+07:00' });
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ id: event.id, title: 'แก้ชื่อ 🌱', description: 'คำอธิบายใหม่', location: 'ห้อง 2', capacity: 7,
      starts_at: '2026-11-08T03:00:00.000Z', ends_at: '2026-11-08T05:30:00.500Z', registration_closes_at: '2026-11-08T02:00:00.000Z',
      status: 'DRAFT', organizer_id: users.OA, created_at: event.createdAt.toISOString(), active_count: 0, available_seats: 7 });
    expect(Date.parse(r.body.data.updated_at)).toBeGreaterThan(event.updatedAt.getTime());
    // Read back in a separate request on the other connection.
    expect((await as('OA', 1).agent.get(`/api/organizer/events/${event.id}`).expect(200)).body).toEqual(r.body);
  });

  it('TEST-46 / AC-35 PUBLISHED allows details/capacity but rejects any time field', async () => {
    const published = await fixture('EPUB2');
    const r = await patch(as('OA'), published.id, { title: 'ชื่อใหม่', description: 'คำอธิบายใหม่', location: 'ห้องใหม่', capacity: 4 });
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ status: 'PUBLISHED', title: 'ชื่อใหม่', capacity: 4, active_count: 2, available_seats: 2 });
    const shared = (await as('PA', 1).agent.get(`/api/events/${published.id}`).expect(200)).body.data;
    expect(shared).toMatchObject({ title: 'ชื่อใหม่', description: 'คำอธิบายใหม่', location: 'ห้องใหม่', capacity: 4, available_seats: 2 });
    const listed = (await as('PA', 1).agent.get('/api/events').expect(200)).body.data.find((e: { id: string }) => e.id === published.id);
    expect(listed).toMatchObject({ title: 'ชื่อใหม่', capacity: 4, available_seats: 2 });

    const cases: [object, number, string][] = [
      [{ starts_at: '2026-11-06T06:00:00.000Z' }, 409, 'FIELD_NOT_EDITABLE'],
      [{ title: 'ไม่ควรเปลี่ยน', ends_at: '2026-11-06T08:00:00.000Z' }, 409, 'FIELD_NOT_EDITABLE'],
      [{ registration_closes_at: new Date(t0 + 3_600_000).toISOString() }, 409, 'FIELD_NOT_EDITABLE'],
      // Check order: EventPatch format (step 2) before the PUBLISHED time rule (step 5) before capacity (step 7).
      [{ starts_at: '2026-11-06T06:00:00' }, 400, 'INVALID_INPUT'],
      [{ capacity: 1, starts_at: '2026-11-06T06:00:00.000Z' }, 409, 'FIELD_NOT_EDITABLE'],
    ];
    for (const [body, status, code] of cases) {
      const event = await fixture('EPUB2');
      error(await patch(as('OA'), event.id, body), status, code);
      await unchanged(event);
    }
  });

  it('TEST-47 / AC-36 CLOSED is not editable and status is checked before field rules', async () => {
    const cases: [object, number, string][] = [
      [{ title: 'ชื่อใหม่' }, 409, 'EVENT_NOT_EDITABLE'],
      [{ starts_at: '2026-11-06T06:00:00.000Z' }, 409, 'EVENT_NOT_EDITABLE'], // step 4 before step 5
      [{ capacity: 4 }, 409, 'EVENT_NOT_EDITABLE'], // step 4 before step 7
      [{ title: '   ' }, 400, 'INVALID_INPUT'], // step 2 before step 4
    ];
    for (const [body, status, code] of cases) {
      const event = await closedByF06();
      error(await patch(as('OA'), event.id, body), status, code);
      await unchanged(event);
    }
  });

  it('TEST-48 / AC-37 rejects invalid EventPatch and merged BR-02 order without changes; accepts boundaries', async () => {
    const event = await fixture('EDRAFT2'), starts = event.startsAt.getTime();
    const invalid: (object | undefined)[] = [{}, undefined, { title: '   ' }, { title: '🌱'.repeat(121) }, { description: 'ก'.repeat(2001) },
      { location: '🌱'.repeat(201) }, { title: null }, ...[0, 1001, '5', 2.5, true, null].map(capacity => ({ capacity })),
      { starts_at: '2026-11-06T05:00:00' }, { starts_at: '2026-11-06T05:00:00.0001Z' },
      ...['id', 'organizer_id', 'status', 'created_at', 'foo'].map(key => ({ title: 'okay', [key]: key === 'status' ? 'PUBLISHED' : 'spoofed' })),
      { registration_closes_at: new Date(starts + 1).toISOString() }, { ends_at: new Date(starts).toISOString() }];
    for (const body of invalid) {
      const r = await patch(as('OA'), event.id, body);
      expect({ body, status: r.status, code: r.body?.error?.code }).toEqual({ body, status: 400, code: 'INVALID_INPUT' });
      await unchanged(event);
    }
    for (const body of [{ title: '🌱'.repeat(120) }, { description: 'ก'.repeat(2000) }, { location: '🌱'.repeat(200) }, { capacity: 1 }, { capacity: 1000 },
      { registration_closes_at: new Date(starts).toISOString() }]) {
      expect({ body, status: (await patch(as('OA'), event.id, body)).status }).toEqual({ body, status: 200 });
    }
    const saved = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(saved).toMatchObject({ title: '🌱'.repeat(120), location: '🌱'.repeat(200), capacity: 1000, registrationClosesAt: event.startsAt });
  });

  it('TEST-49 / AC-38 capacity may equal ACTIVE but not go below; raising a full event reopens it', async () => {
    const equal = await fixture('EPUB2');
    const r = await patch(as('OA'), equal.id, { capacity: 2 });
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ capacity: 2, active_count: 2, available_seats: 0, registration_open: false });

    const below = await fixture('EPUB2');
    error(await patch(as('OA'), below.id, { capacity: 1 }), 409, 'CAPACITY_BELOW_ACTIVE');
    await unchanged(below);

    const full = await fixture('EFULL2');
    const raised = await patch(as('OA'), full.id, { capacity: 2 });
    expect(raised.status).toBe(200);
    expect(raised.body.data).toMatchObject({ available_seats: 1, registration_open: true });
    expect((await register(as('PC'), full.id)).status).toBe(201);
    expect(await db.registration.count({ where: { eventId: full.id, status: 'ACTIVE' } })).toBe(2);
  });

  it('TEST-50 / AC-39 capacity decrease and last-seat registration serialize on the Event lock', async () => {
    const [pidA, pidB] = (await Promise.all([a, b].map(c => c.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`))).map(rows => rows[0].pid);
    async function waiting(pids: number[]) {
      for (const deadline = Date.now() + 8_000; Date.now() < deadline;) {
        const rows = await db.$queryRaw<{ pid: number }[]>`SELECT pid FROM pg_stat_activity WHERE pid = ANY(${pids}::int[]) AND wait_event_type = 'Lock'`;
        if (rows.length === pids.length) return true;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return false;
    }
    for (let round = 0; round < 20; round++) {
      const event = await fixture('EPUB2'), patchFirst = round % 2 === 0;
      let release!: () => void, locked!: () => void;
      const ready = new Promise<void>(resolve => { locked = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
      const hold = locker.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM events WHERE id = ${event.id}::uuid FOR UPDATE`;
        locked(); await gate;
      }, { timeout: 15_000 });
      await ready;
      // Start barrier: queue the first contender on the lock, then the second, then release both.
      const start = { patch: () => patch(as('OA', 0), event.id, { capacity: 2 }).then(r => r), register: () => register(as('PC', 1), event.id).then(r => r) };
      let edit: Promise<request.Response>, join: Promise<request.Response>;
      try {
        if (patchFirst) { edit = start.patch(); expect(await waiting([pidA]), `round ${round}: PATCH waits on Event lock`).toBe(true); join = start.register(); }
        else { join = start.register(); expect(await waiting([pidB]), `round ${round}: register waits on Event lock`).toBe(true); edit = start.patch(); }
        expect(await waiting([pidA, pidB]), `round ${round}: both wait on Event lock`).toBe(true);
      } finally { release(); await hold; }
      const [e, j] = await Promise.all([edit!, join!]);
      const outcome = `${e.status}:${e.body?.error?.code ?? '-'} ${j.status}:${j.body?.error?.code ?? '-'}`;
      // The contender queued first on the Event lock wins; the later one gets 409 with no side effect.
      expect(outcome, `round ${round}`).toBe(patchFirst ? '200:- 409:EVENT_FULL' : '409:CAPACITY_BELOW_ACTIVE 201:-');
      const after = await db.event.findUniqueOrThrow({ where: { id: event.id } });
      const active = await db.registration.count({ where: { eventId: event.id, status: 'ACTIVE' } });
      const pc = await db.registration.count({ where: { eventId: event.id, participantId: users.PC } });
      if (patchFirst) expect({ round, capacity: after.capacity, active, pc }).toEqual({ round, capacity: 2, active: 2, pc: 0 });
      else { expect(after).toEqual(event); expect({ round, active, pc }).toEqual({ round, active: 3, pc: 1 }); }
      expect(active).toBeLessThanOrEqual(after.capacity);
    }
  });

  it('TEST-51 / AC-40 enforces auth → role → CSRF → input → ownership without changes', async () => {
    const event = await fixture('EPUB2'), body = { title: 'ชื่อที่ถูกต้อง' }, path = `/api/organizer/events/${event.id}`;
    const cases: [string, () => Promise<request.Response>, number, string][] = [
      ['anonymous', () => request(runtimes[0].app).patch(path).set('X-CSRF-Token', 'anonymous').send(body), 401, 'AUTH_REQUIRED'],
      ['participant', () => patch(as('PA'), event.id, body), 403, 'ROLE_FORBIDDEN'],
      ['other organizer', () => patch(as('OB'), event.id, body), 404, 'EVENT_NOT_FOUND'],
      ['missing CSRF', () => as('OA').agent.patch(path).send(body), 403, 'CSRF_FAILED'],
      ['wrong CSRF', () => as('OA').agent.patch(path).set('X-CSRF-Token', 'not-the-session-token').send(body), 403, 'CSRF_FAILED'],
      ['malformed path', () => patch(as('OA'), 'not-a-uuid', body), 400, 'INVALID_INPUT'],
      ['unknown id', () => patch(as('OA'), randomUUID(), body), 404, 'EVENT_NOT_FOUND'],
      ['input before scope', () => patch(as('OB'), event.id, {}), 400, 'INVALID_INPUT'],
    ];
    for (const [name, send, status, code] of cases) {
      const r = await send();
      expect({ name, status: r.status, code: r.body?.error?.code }).toEqual({ name, status, code });
      await unchanged(event);
    }
  });
});

describe('F-06 × F-07 cross-feature (Sprint 2 STS TEST-44(c))', () => {
  it('TEST-44(c) / AC-33 cancel → capacity down → reactivate full → capacity up → reactivate the same record', async () => {
    const event = await fixture('EPUB2'); // capacity 3, ACTIVE PA + PB
    const pa = await db.registration.findFirstOrThrow({ where: { eventId: event.id, participantId: users.PA } });
    const active = () => db.registration.count({ where: { eventId: event.id, status: 'ACTIVE' } });
    const history = async () => (await db.registrationHistory.findMany({ where: { registrationId: pa.id }, orderBy: { occurredAt: 'asc' } }))
      .map(h => [h.action, h.actorId, h.occurredAt.getTime()]);

    // 1. PA cancels: ACTIVE 2 → 1.
    clock = t0 + 1_000;
    const cancelled = await as('PA').agent.post(`/api/my/registrations/${pa.id}/cancel`).set('X-CSRF-Token', as('PA').token).send({});
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data).toMatchObject({ id: pa.id, status: 'CANCELLED', cancelled_at: new Date(t0 + 1_000).toISOString() });
    expect(await active()).toBe(1);

    // 2. OA lowers capacity to the new ACTIVE count (1) — allowed only because the cancel freed the seat.
    clock = t0 + 2_000;
    const lowered = await patch(as('OA'), event.id, { capacity: 1 });
    expect(lowered.status).toBe(200);
    expect(lowered.body.data).toMatchObject({ capacity: 1, active_count: 1, available_seats: 0, registration_open: false });

    // 3. PA reactivates while full: 409 EVENT_FULL; the record stays CANCELLED with its cancel time and no new history.
    clock = t0 + 3_000;
    const beforeFull = await db.registration.findUniqueOrThrow({ where: { id: pa.id } });
    error(await register(as('PA'), event.id), 409, 'EVENT_FULL');
    expect(await db.registration.findUniqueOrThrow({ where: { id: pa.id } })).toEqual(beforeFull);
    expect(beforeFull).toMatchObject({ status: 'CANCELLED', cancelledAt: new Date(t0 + 1_000) });
    expect(await history()).toEqual([['REGISTERED', users.PA, t0 - 60_000], ['CANCELLED', users.PA, t0 + 1_000]]);
    expect(await active()).toBe(1);

    // 4. OA raises capacity to 2.
    clock = t0 + 4_000;
    const raised = await patch(as('OA'), event.id, { capacity: 2 });
    expect(raised.status).toBe(200);
    expect(raised.body.data).toMatchObject({ capacity: 2, active_count: 1, available_seats: 1, registration_open: true });

    // 5. PA reactivates: 200 with the same record and first registration time; ACTIVE = 2 = capacity.
    clock = t0 + 5_000;
    const reactivated = await register(as('PA'), event.id);
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.data).toMatchObject({ id: pa.id, status: 'ACTIVE', registered_at: pa.registeredAt.toISOString(), cancelled_at: null });
    expect(await db.registration.count({ where: { eventId: event.id, participantId: users.PA } })).toBe(1);
    expect(await active()).toBe(2);
    expect(await history()).toEqual([['REGISTERED', users.PA, t0 - 60_000], ['CANCELLED', users.PA, t0 + 1_000], ['REACTIVATED', users.PA, t0 + 5_000]]);
    // Read back on the other connection: full again at the edited capacity.
    expect((await as('PC', 1).agent.get(`/api/events/${event.id}`).expect(200)).body.data).toMatchObject({ capacity: 2, available_seats: 0 });
  });
});
