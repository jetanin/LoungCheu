import { config } from 'dotenv';
import request from 'supertest';
import assert from 'node:assert/strict';
import { createDatabaseClient } from '../server/dist/db/client.js';
import { createApp } from '../server/dist/app.js';
import { readConfig } from '../server/dist/config/env.js';

config({ path: 'server/.env', quiet: true });
const settings = readConfig();
if (!process.env.DEMO_SEED_PASSWORD) throw new Error('Set DEMO_SEED_PASSWORD privately and seed before running the local auth smoke.');
const db = createDatabaseClient(settings.databaseUrl);
const runtime = await createApp(settings, db);
try {
  const [target] = await db.$queryRaw`SELECT current_database() AS name`;
  assert.equal(target.name, decodeURIComponent(new URL(settings.databaseUrl).pathname.slice(1)));
  const health = await request(runtime.app).get('/api/health').expect(200);
  assert.equal(health.body.data.status, 'ok');
  const anonymous = await request(runtime.app).get('/api/auth/me').expect(401);
  assert.equal(anonymous.body.error.code, 'AUTH_REQUIRED');
  for (const [username, role] of [['participant.a', 'PARTICIPANT'], ['organizer.a', 'ORGANIZER']]) {
    const agent = request.agent(runtime.app);
    const bootstrap = await agent.get('/api/auth/csrf').expect(200);
    const login = await agent.post('/api/auth/login').set('X-CSRF-Token', bootstrap.body.data.csrf_token)
      .send({ username, password: process.env.DEMO_SEED_PASSWORD }).expect(200);
    assert.equal(login.body.data.role, role);
    assert.deepEqual(Object.keys(login.body.data).sort(), ['display_name', 'id', 'role']);
    const oldCookie = login.headers['set-cookie'][0].split(';')[0];
    assert.notEqual(oldCookie, bootstrap.headers['set-cookie'][0].split(';')[0]);
    assert.deepEqual((await agent.get('/api/auth/me').expect(200)).body, login.body);
    const token = (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token;
    await agent.post('/api/auth/logout').set('X-CSRF-Token', token).send({}).expect(204);
    const loggedOut = await request(runtime.app).get('/api/auth/me').set('Cookie', oldCookie).expect(401);
    assert.equal(loggedOut.body.error.code, 'AUTH_REQUIRED');
  }
  console.log(`Local application database ${target.name}: connection/health, anonymous access and both-role Login/Identity/Logout checks passed (credentials omitted).`);
} finally {
  await runtime.close();
  await db.$disconnect();
}
