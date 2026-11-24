import { randomBytes, randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type AddressInfo } from 'node:net';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createDatabaseClient } from '../../src/db/client.js';
import { hashPassword } from '../../src/modules/accounts/password.js';
import { repoRoot, requireLifecycleMigrations, runNode, withLifecycleDatabase } from '../helpers/lifecycle-environment.js';

async function unusedPort() {
  const probe = createServer();
  await new Promise<void>((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
  const port = (probe.address() as AddressInfo).port;
  await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return port;
}

async function stopBackend(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Owned restart-test process did not stop')), 10_000);
    child.once('close', () => { clearTimeout(timeout); resolve(); });
    if (!child.kill('SIGTERM')) { clearTimeout(timeout); reject(new Error('Unable to stop the owned restart-test process')); }
  });
  console.info('F06_RESTART', JSON.stringify({ event: 'stopped', pid: child.pid }));
}

async function startBackend(url: string, port: number, secret: string, version: string) {
  const child = spawn(process.execPath, ['server/dist/server.js'], {
    cwd: repoRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL: url, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port),
      APP_ORIGIN: `http://127.0.0.1:${port}`, SESSION_SECRET: secret, SESSION_COOKIE_SECURE: 'false', APP_VERSION: version },
  });
  let output = '';
  child.stdout.on('data', chunk => { output += String(chunk); });
  child.stderr.on('data', chunk => { output += String(chunk); });
  let startError: Error | undefined;
  child.once('error', error => { startError = error; });
  try {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (startError) throw startError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Restart-test backend exited before readiness: ${output}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/ready`, { signal: AbortSignal.timeout(500) });
        const body = await response.json() as { data: { status: string; db: string; version: string } };
        if (response.status === 200 && body.data.status === 'ready' && body.data.db === 'connected' && body.data.version === version) {
          console.info('F06_RESTART', JSON.stringify({ event: 'ready', pid: child.pid, port, version }));
          return child;
        }
      } catch { /* The freshly spawned process may not have bound the port yet. */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('Compiled restart-test backend did not become ready');
  } catch (error) { await stopBackend(child); throw error; }
}

// A minimal real HTTP cookie jar: no mocked session or test-only endpoint.
function session(base: string) {
  let cookie = '';
  async function send(path: string, method = 'GET', body?: object, token?: string) {
    const headers: Record<string, string> = {};
    if (cookie) headers.Cookie = cookie;
    if (token) headers['X-CSRF-Token'] = token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${base}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000) });
    for (const setCookie of response.headers.getSetCookie()) {
      if (setCookie.startsWith('loungcheu.sid=')) cookie = setCookie.split(';')[0];
    }
    return { status: response.status, body: await response.json() };
  }
  async function post(path: string, body: object = {}) {
    const csrf = await send('/auth/csrf'); expect(csrf.status).toBe(200);
    return send(path, 'POST', body, csrf.body.data.csrf_token);
  }
  return { get: (path: string) => send(path), post,
    login: async (username: string, password: string) => { expect((await post('/auth/login', { username, password })).status).toBe(200); } };
}

it('NFR-03 / TEST-43 persistence: CANCELLED then reactivated/CLOSED state survives actual compiled backend process restarts', async () => {
  await withLifecycleDatabase(async url => {
    await requireLifecycleMigrations(url);
    const build = await runNode([join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', 'server/tsconfig.build.json'], url);
    expect(build.code, build.stderr + build.stdout).toBe(0);
    const db = createDatabaseClient(url), secret = randomBytes(48).toString('hex'), password = randomBytes(24).toString('hex');
    const owner = randomUUID(), participant = randomUUID(), marker = `f06-restart-${randomUUID()}`;
    const port = await unusedPort(), base = `http://127.0.0.1:${port}`, pids: number[] = [];
    let child: ChildProcess | undefined;
    try {
      const passwordHash = await hashPassword(password);
      await db.user.createMany({ data: [
        { id: owner, username: owner, displayName: 'OA', role: 'ORGANIZER', passwordHash },
        { id: participant, username: participant, displayName: 'PA', role: 'PARTICIPANT', passwordHash },
      ] });
      child = await startBackend(url, port, secret, `${marker}-1`); pids.push(child.pid!);
      const oa = session(base), pa = session(base); await oa.login(owner, password); await pa.login(participant, password);
      const created = await oa.post('/organizer/events', { title: 'Actual process restart fixture', description: 'Synthetic data',
        location: 'Test room', capacity: 2, registration_closes_at: '2099-01-01T02:00:00Z',
        starts_at: '2099-01-01T03:00:00Z', ends_at: '2099-01-01T04:00:00Z' });
      expect(created.status).toBe(201);
      const eventId = created.body.data.id as string;
      expect((await oa.post(`/organizer/events/${eventId}/publish`)).status).toBe(200);
      const first = await pa.post(`/events/${eventId}/registrations`); expect(first.status).toBe(201);
      const reference = first.body.data.id as string, firstTime = first.body.data.registered_at;
      expect((await pa.post(`/my/registrations/${reference}/cancel`)).status).toBe(200);
      const ownPath = `/my/registrations/${reference}`, rosterPath = `/organizer/events/${eventId}/registrations`;
      const cancelled = await pa.get(ownPath), cancelledRoster = await oa.get(rosterPath);
      expect(cancelled.status).toBe(200); expect(cancelled.body.data.status).toBe('CANCELLED');
      expect(cancelled.body.data.cancelled_at).not.toBeNull(); expect(cancelledRoster.body.data.active_count).toBe(0);
      const history = () => db.registrationHistory.findMany({ where: { registrationId: reference }, orderBy: { id: 'asc' } });
      const cancelledHistory = await history(); expect(cancelledHistory).toHaveLength(2);

      await stopBackend(child); child = undefined;
      await expect(fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(500) })).rejects.toThrow();
      child = await startBackend(url, port, secret, `${marker}-2`); pids.push(child.pid!);
      expect(new Set(pids).size).toBe(2);
      // The old cookie also survives, then fresh logins prove readback is not
      // cached in a browser/client session or an old createApp instance.
      expect(await pa.get(ownPath)).toEqual(cancelled);
      const pa2 = session(base), oa2 = session(base); await pa2.login(participant, password); await oa2.login(owner, password);
      expect(await pa2.get(ownPath)).toEqual(cancelled); expect(await oa2.get(rosterPath)).toEqual(cancelledRoster);
      expect(await history()).toEqual(cancelledHistory);
      const reactivated = await pa2.post(`/events/${eventId}/registrations`);
      expect(reactivated.status).toBe(200);
      expect(reactivated.body.data).toMatchObject({ id: reference, registered_at: firstTime, status: 'ACTIVE', cancelled_at: null });
      expect((await oa2.post(`/organizer/events/${eventId}/close`)).status).toBe(200);
      const active = await pa2.get(ownPath), activeRoster = await oa2.get(rosterPath);
      expect(active.body.data.event.status).toBe('CLOSED'); expect(activeRoster.body.data.active_count).toBe(1);
      const activeHistory = await history(); expect(activeHistory).toHaveLength(3);
      expect(activeHistory.map(row => row.action).sort()).toEqual(['CANCELLED', 'REACTIVATED', 'REGISTERED']);

      await stopBackend(child); child = undefined;
      await expect(fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(500) })).rejects.toThrow();
      child = await startBackend(url, port, secret, `${marker}-3`); pids.push(child.pid!);
      expect(new Set(pids).size).toBe(3);
      const pa3 = session(base), oa3 = session(base); await pa3.login(participant, password); await oa3.login(owner, password);
      expect(await pa3.get(ownPath)).toEqual(active); expect(await oa3.get(rosterPath)).toEqual(activeRoster);
      expect(await history()).toEqual(activeHistory);
      const event = await pa3.get(`/events/${eventId}`);
      expect(event.body.data).toMatchObject({ status: 'CLOSED', active_count: 1, available_seats: 1, registration_open: false });
      const rejected = await pa3.post(`/my/registrations/${reference}/cancel`);
      expect(rejected.status).toBe(409); expect(rejected.body.error.code).toBe('REGISTRATION_CLOSED');
      expect(await history()).toEqual(activeHistory);
      console.info('F06_RESTART', JSON.stringify({ event: 'verified', distinctProcesses: pids.length,
        stoppedAndRestarted: 2, registrationRows: await db.registration.count({ where: { eventId } }), historyRows: activeHistory.length }));
    } finally { if (child) await stopBackend(child); await db.$disconnect(); }
  });
}, 120_000);
