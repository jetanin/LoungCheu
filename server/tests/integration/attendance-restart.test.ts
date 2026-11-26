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

async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Owned attendance restart-test process did not stop')), 10_000);
    child.once('close', () => { clearTimeout(timeout); resolve(); });
    if (!child.kill('SIGTERM')) { clearTimeout(timeout); reject(new Error('Unable to stop owned attendance backend')); }
  });
  console.info('F08_RESTART', JSON.stringify({ event: 'stopped', pid: child.pid }));
}

async function start(url: string, port: number, secret: string, version: string) {
  // The actual compiled server entrypoint, without test-only routes or a clock shim.
  const child = spawn(process.execPath, ['server/dist/server.js'], {
    cwd: repoRoot, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL: url, NODE_ENV: 'test', HOST: '127.0.0.1', PORT: String(port),
      APP_ORIGIN: `http://127.0.0.1:${port}`, SESSION_SECRET: secret, SESSION_COOKIE_SECURE: 'false', APP_VERSION: version },
  });
  let output = '', startError: Error | undefined;
  child.stdout.on('data', chunk => { output += String(chunk); });
  child.stderr.on('data', chunk => { output += String(chunk); });
  child.once('error', error => { startError = error; });
  try {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (startError) throw startError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Attendance backend exited before readiness: ${output}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/ready`, { signal: AbortSignal.timeout(500) });
        const body = await response.json() as { data: { status: string; db: string; version: string } };
        if (response.status === 200 && body.data.status === 'ready' && body.data.db === 'connected' && body.data.version === version) {
          console.info('F08_RESTART', JSON.stringify({ event: 'ready', pid: child.pid, port, version }));
          return child;
        }
      } catch { /* Poll readiness while the owned process is starting. */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('Compiled attendance backend did not become ready');
  } catch (error) { await stop(child); throw error; }
}

// Real HTTP cookies and CSRF, with a new jar for each account/re-login.
function session(base: string) {
  let cookie = '';
  async function send(path: string, method = 'GET', body?: object, token?: string) {
    const headers: Record<string, string> = {};
    if (cookie) headers.Cookie = cookie;
    if (token) headers['X-CSRF-Token'] = token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${base}/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10_000) });
    for (const value of response.headers.getSetCookie()) if (value.startsWith('loungcheu.sid=')) cookie = value.split(';')[0];
    return { status: response.status, body: await response.json() };
  }
  async function post(path: string, body: object = {}) {
    const csrf = await send('/auth/csrf'); expect(csrf.status).toBe(200);
    return send(path, 'POST', body, csrf.body.data.csrf_token);
  }
  return { get: (path: string) => send(path), post,
    login: async (username: string, password: string) => { expect((await post('/auth/login', { username, password })).status).toBe(200); } };
}

it('TEST-66 / NFR-03: check-in timestamp, actor and read models survive actual compiled server process restart', async () => {
  await withLifecycleDatabase(async (url, databaseName) => {
    await requireLifecycleMigrations(url);
    const build = await runNode([join(repoRoot, 'node_modules/typescript/bin/tsc'), '-p', 'server/tsconfig.build.json'], url);
    expect(build.code, build.stdout + build.stderr).toBe(0);
    console.info('F08_RESTART', JSON.stringify({ event: 'built', entrypoint: 'server/dist/server.js', exit: build.code }));
    const db = createDatabaseClient(url, 1), reader = createDatabaseClient(url, 1);
    const ids = { oa: randomUUID(), pa: randomUUID(), pb: randomUUID(), pc: randomUUID() };
    const secret = randomBytes(48).toString('hex'), password = randomBytes(24).toString('hex');
    const marker = `f08-restart-${randomUUID()}`, port = await unusedPort(), base = `http://127.0.0.1:${port}`;
    const eventId = randomUUID(), reference = randomUUID(), pids: number[] = [];
    let child: ChildProcess | undefined;
    const snapshot = async () => ({
      event: await reader.event.findUniqueOrThrow({ where: { id: eventId } }),
      records: await reader.registration.findMany({ where: { eventId }, orderBy: { id: 'asc' } }),
      history: await reader.registrationHistory.findMany({ where: { registration: { eventId } }, orderBy: { id: 'asc' } }),
    });
    try {
      const passwordHash = await hashPassword(password);
      await db.user.createMany({ data: Object.entries(ids).map(([role, id]) => ({ id, username: id, passwordHash,
        displayName: `Synthetic ${role}`, role: role === 'oa' ? 'ORGANIZER' as const : 'PARTICIPANT' as const })) });
      // Dynamic ECHECK3 schedule brackets the real server clock near t0+3h.
      // No fixed historical date, wall-clock monkey patch or production clock override.
      const t0 = Date.now() - 3 * 3_600_000;
      await db.event.create({ data: { id: eventId, organizerId: ids.oa, title: 'TEST-66 synthetic event',
        description: 'Actual process restart persistence', location: 'Synthetic room', capacity: 5, status: 'PUBLISHED',
        registrationClosesAt: new Date(t0 + 3_600_000), startsAt: new Date(t0 + 2 * 3_600_000), endsAt: new Date(t0 + 4 * 3_600_000),
        createdAt: new Date(t0 - 1000), updatedAt: new Date(t0 - 1000) } });
      for (const role of ['pa', 'pb', 'pc'] as const) {
        const cancelled = role === 'pc';
        await db.registration.create({ data: { ...(role === 'pa' ? { id: reference } : {}), eventId, participantId: ids[role],
          status: cancelled ? 'CANCELLED' : 'ACTIVE', registeredAt: new Date(t0), cancelledAt: cancelled ? new Date(t0 + 30 * 60_000) : null,
          history: { create: [ { actorId: ids[role], action: 'REGISTERED', occurredAt: new Date(t0) },
            ...(cancelled ? [{ actorId: ids[role], action: 'CANCELLED' as const, occurredAt: new Date(t0 + 30 * 60_000) }] : []) ] } } });
      }
      child = await start(url, port, secret, `${marker}-1`); pids.push(child.pid!);
      const oa = session(base), pa = session(base); await oa.login(ids.oa, password); await pa.login(ids.pa, password);
      const ownPath = `/my/registrations/${reference}`, rosterPath = `/organizer/events/${eventId}/registrations`;
      expect((await pa.get(ownPath)).body.data.checked_in_at).toBeNull();
      expect((await oa.get(rosterPath)).body.data.checked_in_count).toBe(0);
      const before = await snapshot(), earliest = Date.now();
      const checked = await oa.post(`/organizer/events/${eventId}/registrations/${reference}/check-in`), latest = Date.now();
      expect(checked.status).toBe(200);
      const stamp = checked.body.data.checked_in_at as string;
      expect(Date.parse(stamp)).toBeGreaterThanOrEqual(earliest); expect(Date.parse(stamp)).toBeLessThanOrEqual(latest);
      const after = await snapshot();
      expect(after.event).toEqual(before.event); expect(after.history).toEqual(before.history);
      expect(after.records).toEqual(before.records.map(record => record.id === reference
        ? { ...record, checkedInAt: new Date(stamp), checkedInById: ids.oa } : record));
      const roster = await oa.get(rosterPath), own = await pa.get(ownPath), ownList = await pa.get('/my/registrations');
      expect(roster.status).toBe(200); expect(own.status).toBe(200); expect(ownList.status).toBe(200);
      expect(roster.body.data).toMatchObject({ active_count: 2, checked_in_count: 1 });
      expect(roster.body.data.registrations.find((row: { id: string }) => row.id === reference)).toEqual(checked.body.data);
      expect(own.body.data.checked_in_at).toBe(stamp); expect(own.body.data).not.toHaveProperty('checked_in_by_id');
      expect(ownList.body.data).toEqual([own.body.data]);

      await stop(child); child = undefined;
      await expect(fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(500) })).rejects.toThrow();
      child = await start(url, port, secret, `${marker}-2`); pids.push(child.pid!);
      expect(new Set(pids).size).toBe(2);
      expect(await snapshot()).toEqual(after);
      const oa2 = session(base), pa2 = session(base); await oa2.login(ids.oa, password); await pa2.login(ids.pa, password);
      expect(await oa2.get(rosterPath)).toEqual(roster);
      expect(await pa2.get(ownPath)).toEqual(own);
      expect(await pa2.get('/my/registrations')).toEqual(ownList);
      expect(await snapshot()).toEqual(after);
      console.info('F08_RESTART', JSON.stringify({ event: 'verified', databaseName, pids, distinctProcesses: new Set(pids).size,
        stoppedAndRestarted: 1, timestamp: stamp, actorPreserved: true, eventAndHistoryUnchanged: true,
        activeCount: roster.body.data.active_count, checkedInCount: roster.body.data.checked_in_count,
        registrationRows: after.records.length, historyRows: after.history.length, freshOwnerAndParticipantLogins: true }));
    } finally {
      try { if (child) await stop(child); }
      finally { await Promise.all([db.$disconnect(), reader.$disconnect()]); }
    }
  });
}, 120_000);
