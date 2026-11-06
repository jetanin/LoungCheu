import { config } from 'dotenv';
import request from 'supertest';
import assert from 'node:assert/strict';
import { createDatabaseClient } from '../server/dist/db/client.js';
import { createApp } from '../server/dist/app.js';
import { readConfig } from '../server/dist/config/env.js';
import { randomBytes } from 'node:crypto';
import { readTestDatabaseUrl } from '../server/dist/config/database-url.js';
config({ path: '.env.test', quiet: true });
const url = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(url);
const runtime = await createApp(readConfig({ DATABASE_URL: url, SESSION_SECRET: randomBytes(48).toString('hex'), NODE_ENV: 'production', APP_ORIGIN: 'https://example.test', SESSION_COOKIE_SECURE: 'true', APP_VERSION: 'working-tree-smoke' }), db);
try {
  const html = await request(runtime.app).get('/login').expect(200).expect('Content-Type', /text\/html/);
  assert.match(html.text, /<div id="root">/);
  const health = await request(runtime.app).get('/api/health').expect(200);
  assert.equal(health.body.data.version, 'working-tree-smoke');
  const missing = await request(runtime.app).get('/api/missing').expect(404).expect('Content-Type', /json/);
  assert.equal(missing.body.error.code, 'ROUTE_NOT_FOUND');
  console.log('Built production app smoke: SPA /login, database health/version, unknown API JSON 404: 3 passed.');
} finally { await runtime.close(); await db.$disconnect(); }
