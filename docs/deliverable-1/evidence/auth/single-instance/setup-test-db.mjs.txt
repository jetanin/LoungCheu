import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: 'server/.env', quiet: true });
let appUrl;
try { appUrl = new URL(process.env.DATABASE_URL ?? ''); }
catch { throw new Error('Configure a valid application DATABASE_URL in server/.env first.'); }
if (!['postgres:', 'postgresql:'].includes(appUrl.protocol) || !appUrl.hostname || appUrl.pathname.length <= 1) {
  throw new Error('Configure the application DATABASE_URL in server/.env first.');
}
if (decodeURIComponent(appUrl.pathname) === '/loungcheu_test') throw new Error('Application DATABASE_URL must not point to the test database.');
if ((appUrl.searchParams.get('schema') ?? 'public') !== 'public') throw new Error('This test setup uses the public schema.');
const testUrl = new URL(appUrl);
testUrl.pathname = '/loungcheu_test';
const app = new Client({ connectionString: appUrl.toString(), connectionTimeoutMillis: 5000 });
const test = new Client({ connectionString: testUrl.toString(), connectionTimeoutMillis: 5000 });
let created = false;
try {
  await app.connect();
  const exists = await app.query('SELECT 1 FROM pg_database WHERE datname = $1', ['loungcheu_test']);
  if (!exists.rowCount) {
    // Fixed identifier: no user input is interpolated into CREATE DATABASE.
    await app.query('CREATE DATABASE "loungcheu_test"');
    created = true;
  }
  await test.connect();
  const target = await test.query('SELECT current_database() AS name');
  if (target.rows[0].name !== 'loungcheu_test') throw new Error('Unexpected test connection target.');
  const tables = await test.query('SELECT tablename FROM pg_tables WHERE schemaname = $1', ['public']);
  if (tables.rowCount) {
    if (!tables.rows.some(row => row.tablename === '_prisma_migrations')) throw new Error('Existing test database has no project migration history; private configuration was not changed.');
    const known = new Set(readdirSync('server/prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name));
    const applied = await test.query('SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL');
    if (!applied.rowCount || applied.rows.some(row => !known.has(row.migration_name))) throw new Error('Existing test database has an unexpected migration history; private configuration was not changed.');
  }
  const file = '.env.test';
  const previous = existsSync(file) ? readFileSync(file, 'utf8') : '';
  mkdirSync('.local', { recursive: true });
  const backup = '.local/test-env-before-single-instance.env';
  if (previous && !existsSync(backup)) writeFileSync(backup, previous, 'utf8');
  const entry = `TEST_DATABASE_URL=${testUrl.toString()}`;
  const next = /^TEST_DATABASE_URL=.*$/m.test(previous)
    ? previous.replace(/^TEST_DATABASE_URL=.*$/m, () => entry)
    : previous.replace(/\s*$/, '') + (previous.trim() ? '\n' : '') + entry + '\n';
  writeFileSync(file, next, 'utf8');
  console.log(JSON.stringify({ database: 'loungcheu_test', host: appUrl.hostname, port: appUrl.port || '5432', created,
    private_test_config: 'updated', previous_config_backup: previous ? backup : null, credentials: 'omitted' }));
} finally {
  await test.end();
  await app.end();
}
