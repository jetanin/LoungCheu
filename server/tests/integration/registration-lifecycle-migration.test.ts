import { randomBytes, randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { expect, it } from 'vitest';
import request from 'supertest';
import { createDatabaseClient } from '../../src/db/client.js';
import { createApp } from '../../src/app.js';
import { readConfig } from '../../src/config/env.js';
import { hashPassword } from '../../src/modules/accounts/password.js';
import { seedUsers } from '../../src/modules/accounts/seed.js';
import { seedDemoEvents } from '../../prisma/demo-data.js';
import { deployLifecycleMigrations, requireLifecycleMigrations, runNode, withLifecycleDatabase } from '../helpers/lifecycle-environment.js';

async function legacyFixture(client: Client, cancelled = false) {
  const owner = randomUUID(), participant = randomUUID(), event = randomUUID(), reference = randomUUID();
  await client.query(`INSERT INTO users(id,username,password_hash,display_name,role,is_active) VALUES
    ($1::uuid,$1::text,'unused-fixture-hash','OA','ORGANIZER',true),($2::uuid,$2::text,'unused-fixture-hash','PA','PARTICIPANT',true)`, [owner, participant]);
  await client.query(`INSERT INTO events(id,organizer_id,title,description,location,capacity,status,
    registration_closes_at,starts_at,ends_at,created_at,updated_at) VALUES
    ($1,$2,'Legacy fixture','Synthetic data','Test room',2,'PUBLISHED',
    '2099-01-01T02:00:00Z','2099-01-01T03:00:00Z','2099-01-01T04:00:00Z',
    '2026-11-06T01:00:00.123Z','2026-11-06T01:00:00.123Z')`, [event, owner]);
  await client.query(`INSERT INTO registrations(id,event_id,participant_id,status,registered_at)
    VALUES($1,$2,$3,$4,'2026-11-06T03:00:00.123Z')`, [reference, event, participant, cancelled ? 'CANCELLED' : 'ACTIVE']);
  return { owner, participant, event, reference };
}

it('TEST-44(a): real S1→S2 migrate preserves legacy data, backfills REGISTERED once and enforces history FKs', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url, true);
    const client = new Client({ connectionString: url }); await client.connect();
    try {
      const f = await legacyFixture(client);
      await legacyFixture(client);
      const before = (await client.query('SELECT * FROM registrations ORDER BY id')).rows;
      const eventBefore = (await client.query('SELECT * FROM events ORDER BY id')).rows;
      await requireLifecycleMigrations(url);
      const after = (await client.query('SELECT id,event_id,participant_id,status,registered_at FROM registrations ORDER BY id')).rows;
      expect(after).toEqual(before);
      expect((await client.query('SELECT * FROM events ORDER BY id')).rows).toEqual(eventBefore);
      expect((await client.query('SELECT cancelled_at FROM registrations')).rows).toEqual([{ cancelled_at: null }, { cancelled_at: null }]);
      const histories = (await client.query('SELECT * FROM registration_history ORDER BY id')).rows;
      expect(histories).toHaveLength(2);
      expect(new Set(histories.map(row => row.id)).size).toBe(2);
      for (const record of before) {
        const rows = histories.filter(row => row.registration_id === record.id);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ actor_id: record.participant_id, action: 'REGISTERED', occurred_at: record.registered_at });
        expect(rows[0].id).toMatch(/^[a-f0-9-]{36}$/);
      }
      const indexes = (await client.query("SELECT indexname FROM pg_indexes WHERE tablename='registration_history'")).rows;
      expect(indexes.map(row => row.indexname)).toContain('registration_history_registration_id_occurred_at_id_idx');
      await expect(client.query('DELETE FROM registrations WHERE id=$1', [f.reference])).rejects.toMatchObject({ code: '23503' });
      await expect(client.query(`INSERT INTO registration_history(id,registration_id,actor_id,action,occurred_at)
        VALUES($1,$2,$3,'REGISTERED',NOW())`, [randomUUID(), f.reference, randomUUID()])).rejects.toMatchObject({ code: '23503' });
      await requireLifecycleMigrations(url);
      expect((await client.query('SELECT * FROM registration_history ORDER BY id')).rows).toEqual(histories);
      // The current migration chain also includes the additive S3 attendance migration.
      expect((await client.query('SELECT COUNT(*)::int AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL')).rows).toEqual([{ n: 4 }]);
    } finally { await client.end(); }
  });
}, 120_000);

it('TEST-44(a): legacy CANCELLED without its timestamp stops migration without inventing data', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url, true);
    const client = new Client({ connectionString: url }); await client.connect();
    try {
      await legacyFixture(client, true);
      const before = (await client.query('SELECT * FROM registrations ORDER BY id')).rows;
      const result = await deployLifecycleMigrations(url);
      expect(result.code).not.toBe(0);
      expect((await client.query('SELECT * FROM registrations ORDER BY id')).rows).toEqual(before);
      expect((await client.query("SELECT to_regclass('public.registration_history')::text AS history")).rows).toEqual([{ history: null }]);
      expect((await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='registrations' AND column_name='cancelled_at'")).rows).toEqual([]);
      // The operator must see why data reconciliation is required, not only
      // Prisma's secondary "current transaction is aborted" error.
      expect(result.stdout + result.stderr).toContain('Legacy CANCELLED registrations require data reconciliation');
    } finally { await client.end(); }
  });
}, 120_000);

it('TEST-44(a): fresh migrate→actual seed entry point creates history and repeated/concurrent seed preserves it', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const db = createDatabaseClient(url), password = randomBytes(24).toString('hex');
    const seed = () => runNode(['--import', 'tsx', 'server/prisma/seed.ts'], url, { DEMO_SEED_PASSWORD: password });
    const data = async () => ({ events: await db.event.findMany({ orderBy: { id: 'asc' } }),
      records: await db.registration.findMany({ orderBy: { id: 'asc' } }),
      history: await db.registrationHistory.findMany({ orderBy: { id: 'asc' } }) });
    try {
      const first = await seed(); expect(first.code, first.stderr).toBe(0);
      const before = await data();
      expect(before.events).toHaveLength(7); expect(before.records).toHaveLength(6); expect(before.history).toHaveLength(6);
      for (const record of before.records) {
        expect(record.cancelledAt).toBeNull();
        const history = before.history.filter(row => row.registrationId === record.id);
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({ actorId: record.participantId, action: 'REGISTERED', occurredAt: record.registeredAt });
      }
      const again = await seed(); expect(again.code, again.stderr).toBe(0);
      expect(await data()).toEqual(before);
      const concurrent = await Promise.all([seed(), seed()]);
      for (const result of concurrent) expect(result.code, result.stderr).toBe(0);
      expect(await data()).toEqual(before);
    } finally { await db.$disconnect(); }
  });
}, 120_000);

const failingHistory = `CREATE FUNCTION f06_fail_history() RETURNS trigger LANGUAGE plpgsql AS $$
  BEGIN RAISE EXCEPTION 'Controlled history-write failure for isolated test'; END $$;
  CREATE TRIGGER f06_fail_history BEFORE INSERT ON registration_history FOR EACH ROW EXECUTE FUNCTION f06_fail_history();`;

it('TEST-44(a): concurrent actual seed processes on a fresh database create one REGISTERED entry per record', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const db = createDatabaseClient(url), password = randomBytes(24).toString('hex');
    try {
      const commands = await Promise.all([0, 1].map(() => runNode(['--import', 'tsx', 'server/prisma/seed.ts'], url, { DEMO_SEED_PASSWORD: password })));
      for (const command of commands) expect(command.code, command.stderr).toBe(0);
      expect(await db.event.count()).toBe(7);
      const records = await db.registration.findMany(), history = await db.registrationHistory.findMany();
      expect(records).toHaveLength(6); expect(history).toHaveLength(6);
      for (const record of records) {
        const entries = history.filter(row => row.registrationId === record.id);
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ actorId: record.participantId, action: 'REGISTERED', occurredAt: record.registeredAt });
      }
    } finally { await db.$disconnect(); }
  });
}, 120_000);

it.each(['create', 'cancel', 'reactivate'] as const)('TEST-44(b): %s rolls back state and history when the history INSERT fails', async operation => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const db = createDatabaseClient(url), client = new Client({ connectionString: url });
    let runtime: Awaited<ReturnType<typeof createApp>> | undefined;
    try {
      await client.connect();
      const owner = randomUUID(), participant = randomUUID(), password = randomBytes(24).toString('hex');
      const passwordHash = await hashPassword(password);
      await db.user.createMany({ data: [
        { id: owner, username: owner, displayName: 'OA', role: 'ORGANIZER', passwordHash },
        { id: participant, username: participant, displayName: 'PA', role: 'PARTICIPANT', passwordHash },
      ] });
      const event = await db.event.create({ data: { organizerId: owner, title: 'Rollback test', description: 'Synthetic fixture',
        location: 'Test room', capacity: 1, status: 'PUBLISHED', registrationClosesAt: new Date('2099-01-01T02:00:00Z'),
        startsAt: new Date('2099-01-01T03:00:00Z'), endsAt: new Date('2099-01-01T04:00:00Z') } });
      runtime = await createApp(readConfig({ DATABASE_URL: url, NODE_ENV: 'test', APP_ORIGIN: 'http://127.0.0.1:5173',
        SESSION_SECRET: randomBytes(48).toString('hex') }), db);
      const agent = request.agent(runtime.app);
      const pre = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
      await agent.post('/api/auth/login').set('X-CSRF-Token', pre).send({ username: participant, password }).expect(200);
      const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
      const register = () => agent.post(`/api/events/${event.id}/registrations`).set('X-CSRF-Token', token).send({});
      let reference = '';
      if (operation !== 'create') {
        reference = (await register().expect(201)).body.data.id;
        if (operation === 'reactivate') await agent.post(`/api/my/registrations/${reference}/cancel`).set('X-CSRF-Token', token).send({}).expect(200);
      }
      const data = async () => ({ event: await db.event.findUniqueOrThrow({ where: { id: event.id } }),
        records: await db.registration.findMany({ orderBy: { id: 'asc' } }), history: await db.registrationHistory.findMany({ orderBy: { id: 'asc' } }) });
      const before = await data();
      await client.query(failingHistory);
      const result = operation === 'cancel'
        ? await agent.post(`/api/my/registrations/${reference}/cancel`).set('X-CSRF-Token', token).send({}) : await register();
      expect(result.status).toBe(500);
      expect(result.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'ระบบขัดข้อง กรุณาลองใหม่', fields: {} } });
      expect(JSON.stringify(result.body)).not.toContain('Controlled history-write failure');
      expect(await data()).toEqual(before);
      // Removing only the injected fault makes the same operation succeed.
      await client.query('DROP TRIGGER f06_fail_history ON registration_history');
      const recovered = operation === 'cancel'
        ? await agent.post(`/api/my/registrations/${reference}/cancel`).set('X-CSRF-Token', token).send({}) : await register();
      expect(recovered.status).toBe(operation === 'create' ? 201 : 200);
      expect(await db.registrationHistory.count()).toBe(before.history.length + 1);
    } finally { if (runtime) await runtime.close(); await db.$disconnect(); await client.end(); }
  });
}, 120_000);

it('TEST-44(a/b): demo-data history failure rolls back newly seeded events and registrations', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const db = createDatabaseClient(url), client = new Client({ connectionString: url });
    try {
      await client.connect();
      await seedUsers(db, randomBytes(24).toString('hex'));
      const users = await db.user.findMany({ orderBy: { id: 'asc' } });
      await client.query(failingHistory);
      await expect(seedDemoEvents(db)).rejects.toThrow();
      expect(await db.event.count()).toBe(0); expect(await db.registration.count()).toBe(0); expect(await db.registrationHistory.count()).toBe(0);
      expect(await db.user.findMany({ orderBy: { id: 'asc' } })).toEqual(users);
      await client.query('DROP TRIGGER f06_fail_history ON registration_history');
      expect(await seedDemoEvents(db)).toEqual({ createdEvents: 7, createdRegistrations: 6, skippedEvents: 0 });
      expect(await db.registrationHistory.count()).toBe(6);
    } finally { await db.$disconnect(); await client.end(); }
  });
}, 120_000);
