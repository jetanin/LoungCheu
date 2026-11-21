import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Local Compose only. Never print credentials, cookies, tokens or response bodies.
process.loadEnvFile('.env.docker');
const port = process.env.DOCKER_WEB_PORT ?? '5173';
assert.match(port, /^\d+$/);
const origin = `http://127.0.0.1:${port}`;
const statePath = '.local/docker-smoke.json';
const phase = process.argv[2];
assert.ok(['create', 'verify'].includes(phase), 'Use create or verify');
const password = process.env.DOCKER_DEMO_PASSWORD;
assert.ok(password && !password.includes('REPLACE'), 'Configure private Docker demo credentials first');

function agent() {
  let cookie = '', token = '';
  async function call(path, status = 200, body) {
    const response = await fetch(`${origin}/api${path}`, { method: body === undefined ? 'GET' : 'POST',
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : {
        'Content-Type': 'application/json', 'X-CSRF-Token': token, Origin: origin }) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const setCookie = response.headers.getSetCookie()[0];
    if (setCookie) cookie = setCookie.split(';')[0];
    assert.equal(response.status, status, `${path}: unexpected HTTP status`);
    const result = await response.json();
    return result;
  }
  return { call, async login(username) {
    token = (await call('/auth/csrf')).data.csrf_token;
    await call('/auth/login', 200, { username, password });
    token = (await call('/auth/csrf')).data.csrf_token;
  } };
}

try {
  const html = await fetch(`${origin}/login`, { signal: AbortSignal.timeout(15000) });
  assert.equal(html.status, 200);
  assert.match(await html.text(), /<div id="root">/);
  const anonymous = agent();
  assert.equal((await anonymous.call('/ready')).data.status, 'ready');
  assert.equal((await anonymous.call('/health')).data.status, 'ok');
  await anonymous.call('/events', 401);
  const organizer = agent(), participant = agent();
  await organizer.login('organizer.a');
  await participant.login('participant.a');
  let state;
  if (phase === 'create') {
    assert.ok(!existsSync(statePath), 'Existing smoke record preserved; use verify instead');
    const now = Date.now(), at = hours => new Date(now + hours * 3600000).toISOString();
    const title = `Docker persistence ${randomUUID()}`;
    const event = (await organizer.call('/organizer/events', 201, { title, description: 'Local Docker verification',
      location: 'Campus', capacity: 2, starts_at: at(48), ends_at: at(49), registration_closes_at: at(24) })).data;
    await organizer.call(`/organizer/events/${event.id}/publish`, 200, {});
    const registration = (await participant.call(`/events/${event.id}/registrations`, 201, {})).data;
    state = { eventId: event.id, title, registrationId: registration.id };
    mkdirSync('.local', { recursive: true });
    writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  } else {
    state = JSON.parse(readFileSync(statePath, 'utf8'));
  }
  assert.match(state.eventId, /^[0-9a-f-]{36}$/);
  const event = (await organizer.call(`/organizer/events/${state.eventId}`)).data;
  assert.equal(event.title, state.title);
  assert.equal(event.active_count, 1);
  const duplicate = await participant.call(`/events/${state.eventId}/registrations`, 409, {});
  assert.equal(duplicate.error.code, 'ALREADY_REGISTERED');
  console.log(`Docker ${phase}: PASS (SPA, health/readiness, login, event, registration, access/rule checks).`);
  console.log(`Record: ${state.eventId}; preserved active registration count: 1.`);
} catch (error) {
  console.error('Docker smoke failed:', error instanceof assert.AssertionError ? error.message : 'Check local containers and private configuration');
  process.exitCode = 1;
}
