import { randomBytes, randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Client } from 'pg';
import { expect, it } from 'vitest';
import { repoRoot, requireLifecycleMigrations, runNode, withLifecycleDatabase } from '../helpers/lifecycle-environment.js';

// TEST-65 / F-08, NFR-05. Real migration CLI + PostgreSQL; no application
// implementation or substitute CREATE/ALTER statements are used by this test.
const sprint2Migrations = [
  '202611060001_auth',
  '202611060002_registration_extension',
  '202611240001_registration_lifecycle',
];
const stamp = new Date('2026-11-06T03:00:00.123Z');

async function migrateSprint2(url: string) {
  const verification = resolve(repoRoot, '.local/verification');
  await mkdir(verification, { recursive: true });
  const temporary = await mkdtemp(join(verification, 'f08-s2-migrations-'));
  try {
    const migrations = join(temporary, 'migrations');
    await mkdir(migrations);
    for (const name of sprint2Migrations) {
      await mkdir(join(migrations, name));
      await copyFile(join(repoRoot, 'server/prisma/migrations', name, 'migration.sql'), join(migrations, name, 'migration.sql'));
    }
    await writeFile(join(migrations, 'migration_lock.toml'), 'provider = "postgresql"\n');
    const config = join(temporary, 'config.ts');
    await writeFile(config, `import { defineConfig, env } from 'prisma/config';\nexport default defineConfig({ schema: ${JSON.stringify(join(repoRoot, 'server/prisma/schema.prisma'))}, migrations: { path: ${JSON.stringify(migrations)} }, datasource: { url: env('DATABASE_URL') } });\n`);
    const result = await runNode([join(repoRoot, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy', '--config', config], url);
    expect(result.code, result.stdout + result.stderr).toBe(0);
  } finally {
    const target = resolve(temporary);
    if (dirname(target) !== verification || !target.startsWith(join(verification, 'f08-s2-migrations-'))) {
      throw new Error('Refusing cleanup outside the owned F-08 migration directory');
    }
    await rm(target, { recursive: true, force: true });
  }
}

async function fixture(client: Client) {
  const owner = randomUUID(), activeParticipant = randomUUID(), cancelledParticipant = randomUUID(), spareParticipant = randomUUID();
  const event = randomUUID(), active = randomUUID(), cancelled = randomUUID();
  for (const [id, role] of [[owner, 'ORGANIZER'], [activeParticipant, 'PARTICIPANT'],
    [cancelledParticipant, 'PARTICIPANT'], [spareParticipant, 'PARTICIPANT']]) {
    await client.query(`INSERT INTO users(id,username,password_hash,display_name,role,is_active)
      VALUES($1::uuid,$1::text,'unused-synthetic-hash',$1::text,$2::"Role",true)`, [id, role]);
  }
  await client.query(`INSERT INTO events(id,organizer_id,title,description,location,capacity,status,
    registration_closes_at,starts_at,ends_at,created_at,updated_at)
    VALUES($1,$2,'F-08 S2 fixture','Migration preservation','Synthetic room',3,'PUBLISHED',
    '2099-01-01T02:00:00Z','2099-01-01T03:00:00Z','2099-01-01T04:00:00Z',$3,$3)`, [event, owner, stamp]);
  await client.query(`INSERT INTO registrations(id,event_id,participant_id,status,registered_at,cancelled_at)
    VALUES($1,$3,$4,'ACTIVE',$6,NULL),($2,$3,$5,'CANCELLED',$6,'2026-11-06T03:30:00.456Z')`,
  [active, cancelled, event, activeParticipant, cancelledParticipant, stamp]);
  for (const [registration, actor] of [[active, activeParticipant], [cancelled, cancelledParticipant]]) {
    await client.query(`INSERT INTO registration_history(id,registration_id,actor_id,action,occurred_at)
      VALUES($1,$2,$3,'REGISTERED',$4)`, [randomUUID(), registration, actor, stamp]);
  }
  await client.query(`INSERT INTO registration_history(id,registration_id,actor_id,action,occurred_at)
    VALUES($1,$2,$3,'CANCELLED','2026-11-06T03:30:00.456Z')`, [randomUUID(), cancelled, cancelledParticipant]);
  return { owner, event, active, cancelled, spareParticipant };
}

async function attendanceColumns(client: Client) {
  const rows = (await client.query(`SELECT column_name,data_type,datetime_precision,is_nullable
    FROM information_schema.columns WHERE table_schema='public' AND table_name='registrations'
    AND column_name IN ('checked_in_at','checked_in_by_id') ORDER BY column_name`)).rows;
  expect(rows, 'TEST-65: the real S3 migration must add the nullable attendance columns').toEqual([
    { column_name: 'checked_in_at', data_type: 'timestamp with time zone', datetime_precision: 3, is_nullable: 'YES' },
    { column_name: 'checked_in_by_id', data_type: 'uuid', datetime_precision: null, is_nullable: 'YES' },
  ]);
}

async function snapshot(client: Client) {
  return {
    users: (await client.query('SELECT * FROM users ORDER BY id')).rows,
    events: (await client.query('SELECT * FROM events ORDER BY id')).rows,
    records: (await client.query('SELECT * FROM registrations ORDER BY id')).rows,
    history: (await client.query('SELECT * FROM registration_history ORDER BY id')).rows,
  };
}

async function migratedFixture(work: (client: Client, f: Awaited<ReturnType<typeof fixture>>) => Promise<void>) {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
      // At RED, absence of migration is an assertion failure rather than an
      // undefined-column SQL/setup exception masking the intended behaviour.
      await attendanceColumns(client);
      await work(client, await fixture(client));
    } finally { await client.end(); }
  });
}

it('TEST-65(a): S2→S3 migration preserves records/history and initializes attendance to null; deploy is repeatable', async () => {
  await withLifecycleDatabase(async url => {
    await migrateSprint2(url);
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
      await fixture(client);
      const before = await snapshot(client);
      expect(before.records).toHaveLength(2);
      expect(before.history).toHaveLength(3);
      await requireLifecycleMigrations(url);
      await attendanceColumns(client);
      const after = await snapshot(client);
      expect(after.records.map(({ checked_in_at, checked_in_by_id, ...oldFields }) => {
        expect(checked_in_at).toBeNull(); expect(checked_in_by_id).toBeNull();
        return oldFields;
      })).toEqual(before.records);
      expect(after.users).toEqual(before.users);
      expect(after.events).toEqual(before.events);
      expect(after.history).toEqual(before.history);
      await requireLifecycleMigrations(url);
      expect(await snapshot(client)).toEqual(after);
    } finally { await client.end(); }
  });
}, 120_000);

async function seedRun(url: string, password: string) {
  const result = await runNode(['--import', 'tsx', 'server/prisma/seed.ts'], url, { DEMO_SEED_PASSWORD: password });
  expect(result.code, result.stdout + result.stderr).toBe(0);
}

async function checkDemo(client: Client, seedStarted: number, seedEnded: number) {
  // Existing S2 examples have no event spanning a week from Bangkok midnight.
  // Identify the new scenario by its contract, without prescribing an ID/title.
  const candidates = (await client.query(`SELECT * FROM events WHERE title LIKE '[DEMO]%'
    AND status='PUBLISHED' AND registration_closes_at=starts_at
    AND ends_at=starts_at + INTERVAL '7 days'`)).rows;
  expect(candidates, 'TEST-65: actual seed must create one attendance demo scenario').toHaveLength(1);
  const event = candidates[0];
  const midnight = (ms: number) => {
    const local = new Date(ms + 7 * 3_600_000);
    return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 7 * 3_600_000;
  };
  expect([midnight(seedStarted), midnight(seedEnded)]).toContain(event.starts_at.getTime());
  const records = (await client.query('SELECT * FROM registrations WHERE event_id=$1 ORDER BY id', [event.id])).rows;
  expect(records).toHaveLength(2);
  expect(records.every(r => r.status === 'ACTIVE')).toBe(true);
  await attendanceColumns(client);
  const checked = records.filter(r => r.checked_in_at !== null);
  expect(checked).toHaveLength(1);
  expect(checked[0].checked_in_by_id).toBe(event.organizer_id);
  expect(checked[0].checked_in_at.getTime()).toBeGreaterThanOrEqual(event.starts_at.getTime());
  expect(checked[0].checked_in_at.getTime()).toBeLessThanOrEqual(event.ends_at.getTime());
  expect(records.find(r => r.checked_in_at === null)?.checked_in_by_id).toBeNull();
  const all = await snapshot(client);
  expect(all.events).toHaveLength(7);
  expect(all.records).toHaveLength(6);
  expect(all.history).toHaveLength(6);
  for (const record of all.records) {
    const history = all.history.filter(h => h.registration_id === record.id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ action: 'REGISTERED', actor_id: record.participant_id, occurred_at: record.registered_at });
  }
  return checked[0];
}

it('TEST-65(b): fresh migrate→real seed creates attendance demo; repeated/concurrent seed preserves edited check-in and history', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const client = new Client({ connectionString: url });
    const password = randomBytes(24).toString('hex');
    await client.connect();
    try {
      const start = Date.now(); await seedRun(url, password);
      const checked = await checkDemo(client, start, Date.now());
      // Make an identifiable valid change: seed must preserve real usage,
      // rather than resetting attendance to its original example value.
      const edited = new Date(checked.checked_in_at.getTime() + 1);
      await client.query('UPDATE registrations SET checked_in_at=$1 WHERE id=$2', [edited, checked.id]);
      const before = await snapshot(client);
      await seedRun(url, password);
      expect(await snapshot(client)).toEqual(before);
      await Promise.all([seedRun(url, password), seedRun(url, password)]);
      expect(await snapshot(client)).toEqual(before);
    } finally { await client.end(); }
  });
}, 120_000);

it('TEST-65(b): two actual seed processes on a fresh migrated DB create one attendance scenario and one REGISTERED history per record', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const client = new Client({ connectionString: url });
    const password = randomBytes(24).toString('hex');
    await client.connect();
    try {
      const start = Date.now();
      await Promise.all([seedRun(url, password), seedRun(url, password)]);
      await checkDemo(client, start, Date.now());
    } finally { await client.end(); }
  });
}, 120_000);

const invalid = [
  { name: 'timestamp without actor', kind: 'time', code: '23514' },
  { name: 'actor without timestamp', kind: 'actor', code: '23514' },
  { name: 'CANCELLED with attendance', kind: 'cancelled', code: '23514' },
  { name: 'nonexistent actor', kind: 'foreign-key', code: '23503' },
] as const;

it.each(invalid)('TEST-65(c): CHECK/FK rejects INSERT and UPDATE with $name and preserves data', async ({ kind, code }) => {
  await migratedFixture(async (client, f) => {
    const before = await snapshot(client);
    const checkedAt = kind === 'actor' ? null : stamp;
    const actor = kind === 'time' ? null : kind === 'foreign-key' ? randomUUID() : f.owner;
    const cancelled = kind === 'cancelled';
    // Both INSERT and UPDATE must reject the invalid state, not just a
    // particular application path. No transaction is left aborted afterwards.
    await expect(client.query(`INSERT INTO registrations(id,event_id,participant_id,status,registered_at,cancelled_at,checked_in_at,checked_in_by_id)
      VALUES($1,$2,$3,$4::"RegistrationStatus",$5,$6,$7,$8)`,
    [randomUUID(), f.event, f.spareParticipant, cancelled ? 'CANCELLED' : 'ACTIVE', stamp, cancelled ? stamp : null, checkedAt, actor]))
      .rejects.toMatchObject({ code });
    expect(await snapshot(client)).toEqual(before);
    await expect(client.query('UPDATE registrations SET checked_in_at=$1,checked_in_by_id=$2 WHERE id=$3',
      [checkedAt, actor, cancelled ? f.cancelled : f.active])).rejects.toMatchObject({ code });
    expect(await snapshot(client)).toEqual(before);
  });
}, 120_000);

it('TEST-65(c): valid nullable/pair values persist with millisecond precision and checked-in actor FK is Restrict', async () => {
  await migratedFixture(async (client, f) => {
    const checker = randomUUID();
    await client.query(`INSERT INTO users(id,username,password_hash,display_name,role,is_active)
      VALUES($1::uuid,$1::text,'unused-synthetic-hash','Attendance FK fixture','ORGANIZER',true)`, [checker]);
    const before = await snapshot(client);
    await client.query('UPDATE registrations SET checked_in_at=$1,checked_in_by_id=$2 WHERE id=$3', [stamp, checker, f.active]);
    const row = (await client.query('SELECT * FROM registrations WHERE id=$1', [f.active])).rows[0];
    expect(row).toMatchObject({ checked_in_at: stamp, checked_in_by_id: checker });
    const after = await snapshot(client);
    expect(after.events).toEqual(before.events);
    expect(after.history).toEqual(before.history);
    // checker has no Event/participant/history references, so this rejection
    // specifically proves the new checked_in_by_id FK, not a pre-existing FK.
    await expect(client.query('DELETE FROM users WHERE id=$1', [checker])).rejects.toMatchObject({ code: '23503' });
    expect(await snapshot(client)).toEqual(after);
    await client.query('UPDATE registrations SET checked_in_at=NULL,checked_in_by_id=NULL WHERE id=$1', [f.active]);
    expect((await client.query('SELECT checked_in_at,checked_in_by_id FROM registrations WHERE id=$1', [f.active])).rows)
      .toEqual([{ checked_in_at: null, checked_in_by_id: null }]);
  });
}, 120_000);
