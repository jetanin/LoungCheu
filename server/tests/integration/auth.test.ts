import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomBytes } from 'node:crypto';
import { createDatabaseClient } from '../../src/db/client.js';
import { Pool } from 'pg';
import { createApp, SESSION_MS } from '../../src/app.js';
import { seedUsers } from '../../src/modules/accounts/seed.js';
import { readConfig } from '../../src/config/env.js';
import { requireAuth, requireRole } from '../../src/middleware/auth.js';
import { errorHandler } from '../../src/shared/errors.js';
import express from 'express';
import { readTestDatabaseUrl } from '../../src/config/database-url.js';

const databaseUrl = readTestDatabaseUrl(process.env.TEST_DATABASE_URL);
const db = createDatabaseClient(databaseUrl);
const pool = new Pool({ connectionString: databaseUrl });
const password = randomBytes(24).toString('hex');
const t0 = Date.parse('2026-11-06T03:00:00.000Z');
let clock = t0;
const config = readConfig({ DATABASE_URL: databaseUrl, SESSION_SECRET: randomBytes(48).toString('hex'), APP_ORIGIN: 'http://127.0.0.1:5173', NODE_ENV: 'test' });
let runtime: Awaited<ReturnType<typeof createApp>>;
let fixtureUsers: Awaited<ReturnType<typeof db.user.findMany>>;
type Agent = ReturnType<typeof request.agent>;
const cookieOf = (response: request.Response): string => (response.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
async function csrf(agent: Agent) {
  const result = await agent.get('/api/auth/csrf').expect(200);
  return { token: result.body.data.csrf_token as string, cookie: cookieOf(result) };
}
async function login(username = 'participant.a', submittedPassword = password) {
  const agent = request.agent(runtime.app), pre = await csrf(agent);
  const response = await agent.post('/api/auth/login').set('X-CSRF-Token', pre.token).send({ username, password: submittedPassword }).expect(200);
  return { agent, pre, response, cookie: cookieOf(response), token: (await agent.get('/api/auth/csrf').expect(200)).body.data.csrf_token as string };
}
function expectError(response: request.Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: { code, message: expect.any(String), fields: expect.any(Object) } });
}

beforeAll(async () => {
  await seedUsers(db, password);
  fixtureUsers = await db.user.findMany();
  runtime = await createApp(config, db, () => clock);
});
beforeEach(async () => {
  clock = t0;
  await pool.query('DELETE FROM sessions');
  await db.$transaction(fixtureUsers.map(user => db.user.update({ where: { id: user.id }, data: {
    passwordHash: user.passwordHash, displayName: user.displayName, role: user.role, isActive: user.isActive,
  } })));
});
afterAll(async () => { if (runtime) await runtime.close(); await db.$disconnect(); await pool.end(); });

describe('F-01 API with real PostgreSQL sessions', () => {
  it('seed is idempotent and preserves identities and salted hashes on repeated execution', async () => {
    const before = await db.user.findMany({ orderBy: { username: 'asc' } });
    await seedUsers(db, password);
    expect(await db.user.findMany({ orderBy: { username: 'asc' } })).toEqual(before);
    expect(before).toHaveLength(6);
    expect(new Set(before.map(user => user.passwordHash)).size).toBe(6);
  });
  it.each([['participant.a', 'PARTICIPANT'], ['organizer.a', 'ORGANIZER']])('TEST-01/03 rotates session and returns only Identity for %s', async (username, role) => {
    const { agent, pre, response, cookie } = await login(username);
    expect(cookie).not.toBe(pre.cookie);
    const user = await db.user.findUniqueOrThrow({ where: { username } });
    const expected = { data: { id: user.id, display_name: user.displayName, role } };
    expect(response.body).toEqual(expected);
    expect((await agent.get('/api/auth/me').expect(200)).body).toEqual(expected);
    const stored = await pool.query('SELECT sess FROM sessions');
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0].sess.userId).toBe(user.id);
    expect(stored.rows[0].sess.expiresAt).toBe(t0 + SESSION_MS);
    expect((await request(runtime.app).get('/api/auth/me').set('Cookie', pre.cookie)).status).toBe(401);
  });
  it('TEST-03 isolates two participants and logging one out preserves the other session', async () => {
    const a = await login('participant.a'), b = await login('participant.b');
    expect(a.response.body.data.id).not.toBe(b.response.body.data.id);
    expect((await a.agent.get('/api/auth/me').expect(200)).body).toEqual(a.response.body);
    expect((await b.agent.get('/api/auth/me').expect(200)).body).toEqual(b.response.body);
    await a.agent.post('/api/auth/logout').set('X-CSRF-Token', a.token).send({}).expect(204);
    expectError(await a.agent.get('/api/auth/me'), 401, 'AUTH_REQUIRED');
    expect((await b.agent.get('/api/auth/me').expect(200)).body).toEqual(b.response.body);
  });
  it('TEST-03 rejects anonymous and tampered cookies without private data', async () => {
    expectError(await request(runtime.app).get('/api/auth/me'), 401, 'AUTH_REQUIRED');
    const { cookie } = await login();
    const result = await request(runtime.app).get('/api/auth/me').set('Cookie', `${cookie}tampered`);
    expectError(result, 401, 'AUTH_REQUIRED');
    expect(result.headers['cache-control']).toBe('no-store');
  });
  it('TEST-03 reads the same identity after recreating the app with PostgreSQL sessions', async () => {
    const { cookie, response } = await login();
    await runtime.close();
    runtime = await createApp(config, db, () => clock);
    expect((await request(runtime.app).get('/api/auth/me').set('Cookie', cookie).expect(200)).body).toEqual(response.body);
  });
  it.each([{}, { username: '', password: 'x' }, { username: '  ', password: 'x' }, { username: 1, password: 'x' },
    { username: 'participant.a', password: '' }, { username: 'participant.a', password: true },
    { username: 'participant.a', password: 'x', role: 'ORGANIZER' }, [], null, 'string'])('TEST-02 rejects invalid body %j without authenticating', async body => {
    const agent = request.agent(runtime.app), pre = await csrf(agent);
    const result = await agent.post('/api/auth/login').set('X-CSRF-Token', pre.token).set('Content-Type', 'application/json').send(JSON.stringify(body));
    expectError(result, 400, 'INVALID_INPUT');
    expectError(await agent.get('/api/auth/me'), 401, 'AUTH_REQUIRED');
  });
  it('TEST-02 rejects malformed JSON after valid CSRF', async () => {
    const agent = request.agent(runtime.app), pre = await csrf(agent);
    expectError(await agent.post('/api/auth/login').set('X-CSRF-Token', pre.token).set('Content-Type', 'application/json').send('{'), 400, 'INVALID_INPUT');
  });
  it('TEST-02 rejects unsupported JSON charset as INVALID_INPUT', async () => {
    const agent = request.agent(runtime.app), pre = await csrf(agent);
    const result = await agent.post('/api/auth/login').set('X-CSRF-Token', pre.token)
      .set('Content-Type', 'application/json; charset=iso-8859-1').send('{}');
    expectError(result, 400, 'INVALID_INPUT');
  });
  it('TEST-02 uses one credential error for unknown, wrong, inactive and case-mismatched accounts', async () => {
    const bodies: unknown[] = [];
    for (const [username, submittedPassword] of [['unknown', password], ['participant.a', 'wrong'], ['inactive.x', password], ['Participant.a', password],
      ['participant.a\u0000', password], ['unknown\u0000name', password]]) {
      const agent = request.agent(runtime.app), pre = await csrf(agent);
      const result = await agent.post('/api/auth/login').set('X-CSRF-Token', pre.token).send({ username, password: submittedPassword });
      expectError(result, 401, 'INVALID_CREDENTIALS'); bodies.push(result.body);
      expectError(await agent.get('/api/auth/me'), 401, 'AUTH_REQUIRED');
    }
    expect(bodies.every(body => JSON.stringify(body) === JSON.stringify(bodies[0]))).toBe(true);
  });
  it('TEST-02 trims username and preserves password exactly', async () => {
    await login('  participant.a  ');
    const spaced = ` ${password} `;
    const { hashPassword } = await import('../../src/modules/accounts/password.js');
    await db.user.update({ where: { username: 'participant.b' }, data: { passwordHash: await hashPassword(spaced) } });
    await login('participant.b', spaced);
    const agent = request.agent(runtime.app), pre = await csrf(agent);
    expectError(await agent.post('/api/auth/login').set('X-CSRF-Token', pre.token).send({ username: 'participant.b', password }), 401, 'INVALID_CREDENTIALS');
  });
  it.each(['participant.a', 'organizer.a'])('TEST-04 destroys server session and clears cookie for %s', async username => {
    const { agent, cookie, token } = await login(username);
    const result = await agent.post('/api/auth/logout').set('X-CSRF-Token', token).send({}).expect(204);
    expect(result.text).toBe('');
    expect(result.headers['set-cookie'][0]).toMatch(/loungcheu.sid=;.*Path=\/;.*HttpOnly;.*SameSite=Lax/);
    expect((await pool.query('SELECT sid FROM sessions')).rows).toHaveLength(0);
    expectError(await request(runtime.app).get('/api/auth/me').set('Cookie', cookie), 401, 'AUTH_REQUIRED');
    expectError(await request(runtime.app).post('/api/auth/logout'), 401, 'AUTH_REQUIRED');
  });
  it('TEST-04 validates EmptyInput and accepts absent logout body', async () => {
    const { agent, token } = await login();
    for (const body of [{ role: 'ORGANIZER' }, [], null, 'text', false, 1]) {
      expectError(await agent.post('/api/auth/logout').set('X-CSRF-Token', token).set('Content-Type', 'application/json').send(JSON.stringify(body)), 400, 'INVALID_INPUT');
    }
    expectError(await agent.post('/api/auth/logout').set('X-CSRF-Token', token).set('Content-Type', 'text/plain').send('unexpected'), 400, 'INVALID_INPUT');
    await agent.post('/api/auth/logout').set('X-CSRF-Token', token).expect(204);
  });
  it('TEST-05 rejects missing/wrong CSRF, cross-origin and old token after rotation without mutating users', async () => {
    const before = await db.user.findMany({ orderBy: { username: 'asc' } });
    const agent = request.agent(runtime.app), pre = await csrf(agent);
    for (const token of ['', 'wrong', 'é'.repeat(64)]) {
      expectError(await agent.post('/api/auth/login').set('X-CSRF-Token', token).send({ username: 'participant.a', password }), 403, 'CSRF_FAILED');
    }
    expectError(await agent.post('/api/auth/login').set('X-CSRF-Token', pre.token).set('Origin', 'https://evil.test').send({ username: 'participant.a', password }), 403, 'CSRF_FAILED');
    const signedIn = await login();
    for (const token of ['', 'wrong', signedIn.pre.token]) expectError(await signedIn.agent.post('/api/auth/logout').set('X-CSRF-Token', token).send({}), 403, 'CSRF_FAILED');
    expectError(await signedIn.agent.post('/api/auth/logout').set('X-CSRF-Token', signedIn.token).set('Origin', 'https://evil.test').send({}), 403, 'CSRF_FAILED');
    await signedIn.agent.get('/api/auth/me').expect(200);
    await signedIn.agent.post('/api/auth/logout').set('X-CSRF-Token', signedIn.token).set('Origin', config.appOrigin).send({}).expect(204);
    expect(await db.user.findMany({ orderBy: { username: 'asc' } })).toEqual(before);
  });
  it('TEST-05 sets HttpOnly/SameSite and does not extend the database expiry on reads', async () => {
    const { agent, response } = await login();
    expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/);
    expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
    expect(response.headers['set-cookie'][0]).not.toMatch(/; Secure/);
    const before = await pool.query('SELECT expire FROM sessions');
    await agent.get('/api/auth/me').expect(200);
    await agent.get('/api/auth/csrf').expect(200);
    expect((await pool.query('SELECT expire FROM sessions')).rows).toEqual(before.rows);
  });
  it('session cleanup removes expired infrastructure rows and preserves an active login', async () => {
    const { agent } = await login();
    await pool.query("INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, NOW() - INTERVAL '1 minute')", ['expired-infrastructure-fixture', '{}']);
    await new Promise<void>((resolve, reject) => runtime.store.pruneSessions(error => error ? reject(error) : resolve()));
    expect((await pool.query('SELECT sid FROM sessions WHERE sid = $1', ['expired-infrastructure-fixture'])).rows).toHaveLength(0);
    expect((await pool.query('SELECT sid FROM sessions')).rows).toHaveLength(1);
    await agent.get('/api/auth/me').expect(200);
  });
  it('TEST-05 emits Secure cookies on a trusted HTTPS production request', async () => {
    const secure = await createApp({ ...config, production: true, cookieSecure: true, appOrigin: 'https://example.test' }, db, () => clock);
    try {
      const result = await request(secure.app).get('/api/auth/csrf').set('X-Forwarded-Proto', 'https').expect(200);
      expect(result.headers['set-cookie'][0]).toMatch(/; Secure/);
      const plain = await request(secure.app).get('/api/auth/csrf').expect(200);
      expect(plain.headers['set-cookie']).toBeUndefined();
    } finally { await secure.close(); }
  });
  it('TEST-06 rejects at absolute expiry even when a copied cookie is replayed after activity', async () => {
    const { cookie } = await login();
    clock = t0 + SESSION_MS - 1;
    await request(runtime.app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    clock += 1;
    const expired = await request(runtime.app).get('/api/auth/me').set('Cookie', cookie);
    expectError(expired, 401, 'AUTH_REQUIRED');
    expect((await pool.query('SELECT sid FROM sessions')).rows).toHaveLength(0);
    clock += 1;
    expectError(await request(runtime.app).get('/api/auth/me').set('Cookie', cookie), 401, 'AUTH_REQUIRED');
  });
  it('TEST-06 rejects an account disabled after login', async () => {
    const { agent } = await login();
    await db.user.update({ where: { username: 'participant.a' }, data: { isActive: false } });
    expectError(await agent.get('/api/auth/me'), 401, 'AUTH_REQUIRED');
  });
  it('TEST-32 returns JSON for unknown API routes and generic dependency failure', async () => {
    expectError(await request(runtime.app).get('/api/unknown'), 404, 'ROUTE_NOT_FOUND');
    const unavailableDb = new Proxy(db, { get(target, property, receiver) {
      if (property === '$queryRaw') return async () => { throw new Error('SQL SECRET TRACE'); };
      return Reflect.get(target, property, receiver);
    } });
    const failed = await createApp(config, unavailableDb, () => clock);
    try {
      const result = await request(failed.app).get('/api/health');
      expectError(result, 500, 'INTERNAL_ERROR'); expect(result.text).not.toMatch(/SQL|SECRET|TRACE/);
    } finally { await failed.close(); }
  });
  it('shared authorization checks current backend role before an action', async () => {
    // Test-only harness; no test endpoint is exposed by createApp.
    const app = express();
    const participant = await db.user.findUniqueOrThrow({ where: { username: 'participant.a' } });
    app.use((req, _res, next) => { req.session = { userId: participant.id, expiresAt: t0 + SESSION_MS } as typeof req.session; next(); });
    app.post('/organizer', requireAuth(db, () => clock), requireRole('ORGANIZER'), (_req, res) => res.sendStatus(204)); app.use(errorHandler);
    expectError(await request(app).post('/organizer'), 403, 'ROLE_FORBIDDEN');
    await db.user.update({ where: { id: participant.id }, data: { role: 'ORGANIZER' } });
    try { await request(app).post('/organizer').expect(204); }
    finally { await db.user.update({ where: { id: participant.id }, data: { role: 'PARTICIPANT' } }); }
  });
});
