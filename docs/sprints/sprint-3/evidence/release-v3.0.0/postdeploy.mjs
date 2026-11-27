// Sprint 3 post-deploy check on the live app. Usage: node postdeploy.mjs <secretFile> <logFile>
// The password is read from the file and never printed. Logs hold only status codes and response data.
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = 'https://scccd8b05-4d7hbszvwq-as.a.run.app';
const PASSWORD = readFileSync(process.argv[2], 'utf8').trim();
const out = [];
const log = (...a) => { const line = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); out.push(line); console.log(line); };
const stamp = () => new Date().toISOString();
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); log(`${ok ? 'PASS' : 'FAIL'} ${name}`, detail ?? ''); };

class Client {
  constructor(name) { this.name = name; this.jar = new Map(); this.csrf = ''; }
  async req(method, path, body) {
    const headers = { Accept: 'application/json' };
    if (this.jar.size) headers.Cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ');
    if (method !== 'GET') { headers['Content-Type'] = 'application/json'; headers['X-CSRF-Token'] = this.csrf; }
    const r = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
    for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(';'); const i = kv.indexOf('='); this.jar.set(kv.slice(0, i), kv.slice(i + 1)); }
    let json = null; try { json = await r.json(); } catch {}
    return { status: r.status, json };
  }
  async token() { this.csrf = (await this.req('GET', '/api/auth/csrf')).json.data.csrf_token; }
  async login(username) {
    await this.token();
    const r = await this.req('POST', '/api/auth/login', { username, password: PASSWORD });
    if (r.status !== 200) throw new Error(`login ${username} -> ${r.status} ${r.json?.error?.code}`);
    await this.token();
    log(`[${stamp()}] login ${username}: 200`);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

log(`# Sprint 3 post-deploy check, started ${stamp()} (UTC), base ${BASE}`);
const ready = await (await fetch(BASE + '/api/ready')).json();
log('GET /api/ready ->', ready.data);
check('ready = release merge commit 3f80759', ready.data.version === '3f80759439d628d97ee0b1f33deb1b1d87c6d39d' && ready.data.db === 'connected');

const anon = new Client('anon');
for (const p of ['/api/organizer/events/1a3914aa-774f-4d13-bd38-105fd08462cd/summary', '/api/my/registrations']) {
  const r = await anon.req('GET', p); check(`anonymous GET ${p} -> 401`, r.status === 401, `${r.status} ${r.json?.error?.code}`);
}

const org = new Client('organizer.a'), pa = new Client('participant.a');
await org.login('organizer.a'); await pa.login('participant.a');

// NFR-03: Lab 5 records still present after the Sprint 3 redeploy.
const L5 = '1a3914aa-774f-4d13-bd38-105fd08462cd', L5REG = 'dd47235f-be9f-46ed-830a-4d49586cf1e2';
const l5ev = await org.req('GET', `/api/organizer/events/${L5}`);
log('L5 event ->', l5ev.status, { title: l5ev.json?.data?.title, status: l5ev.json?.data?.status, capacity: l5ev.json?.data?.capacity });
check('NFR-03: Lab 5 event L5-C05-20261122-A still present', l5ev.status === 200 && l5ev.json.data.title === 'L5-C05-20261122-A');
const l5own = await pa.req('GET', `/api/my/registrations/${L5REG}`);
log('L5 registration (participant.a) ->', l5own.status, l5own.json?.data && { id: l5own.json.data.id, status: l5own.json.data.status, registered_at: l5own.json.data.registered_at, checked_in_at: l5own.json.data.checked_in_at });
check('NFR-03: Lab 5 registration dd47235f still present with same id; new field checked_in_at = null', l5own.status === 200 && l5own.json.data.id === L5REG && l5own.json.data.checked_in_at === null);
const l5sum = await org.req('GET', `/api/organizer/events/${L5}/summary`);
log('L5 summary (organizer.a) ->', l5sum.status, l5sum.json?.data);
check('F-09 on existing data: summary 200', l5sum.status === 200);

// API 403: participant on organizer-only F-08/F-09 endpoints.
const s403 = await pa.req('GET', `/api/organizer/events/${L5}/summary`);
check('API 403: participant GET summary', s403.status === 403, `${s403.status} ${s403.json?.error?.code}`);
const c403 = await pa.req('POST', `/api/organizer/events/${L5}/registrations/${L5REG}/check-in`, {});
check('API 403: participant POST check-in', c403.status === 403, `${c403.status} ${c403.json?.error?.code}`);
const r403 = await pa.req('GET', `/api/organizer/events/${L5}/registrations`);
check('API 403: participant GET roster', r403.status === 403, `${r403.status} ${r403.json?.error?.code}`);

// F-08 / F-09 smoke on a new short event (registration closes in 2.5 min, starts in 3 min).
const now = Date.now();
const iso = ms => new Date(ms).toISOString();
const body = { title: `D2-S3-POSTDEPLOY-${iso(now).slice(0, 16).replace(/[-:T]/g, '')}`, description: 'Sprint 3 post-deploy smoke (F-08 check-in, F-09 summary).',
  location: 'CPE KMUTT', capacity: 3, registration_closes_at: iso(now + 150_000), starts_at: iso(now + 180_000), ends_at: iso(now + 3_600_000) };
const created = await org.req('POST', '/api/organizer/events', body);
const ev = created.json?.data; log('create event ->', created.status, ev && { id: ev.id, title: ev.title, status: ev.status, registration_closes_at: ev.registration_closes_at, starts_at: ev.starts_at, ends_at: ev.ends_at });
check('create DRAFT event', created.status === 201);
const pub = await org.req('POST', `/api/organizer/events/${ev.id}/publish`, {});
check('publish', pub.status === 200, `${pub.status} ${pub.json?.data?.status}`);
const reg = await pa.req('POST', `/api/events/${ev.id}/registrations`, {});
const regId = reg.json?.data?.id; log('participant.a register ->', reg.status, reg.json?.data && { id: regId, status: reg.json.data.status });
check('participant.a registers', reg.status === 201);
const early = await org.req('POST', `/api/organizer/events/${ev.id}/registrations/${regId}/check-in`, {});
check('F-08: check-in before starts_at -> 409 CHECK_IN_NOT_OPEN', early.status === 409 && early.json?.error?.code === 'CHECK_IN_NOT_OPEN', `${early.status} ${early.json?.error?.code}`);
const before = await org.req('GET', `/api/organizer/events/${ev.id}/summary`);
log('summary before start ->', before.status, before.json?.data);

const wait = Date.parse(ev.starts_at) - Date.now() + 5_000;
log(`[${stamp()}] waiting ${Math.round(wait / 1000)} s for starts_at ${ev.starts_at}`);
await sleep(Math.max(wait, 0));
await org.login('organizer.a'); await pa.login('participant.a'); // fresh sessions after the wait

const ok = await org.req('POST', `/api/organizer/events/${ev.id}/registrations/${regId}/check-in`, {});
log('organizer.a check-in ->', ok.status, ok.json?.data);
check('F-08: owner check-in inside window -> 200 with checked_in_at', ok.status === 200 && !!ok.json?.data?.checked_in_at);
const dup = await org.req('POST', `/api/organizer/events/${ev.id}/registrations/${regId}/check-in`, {});
check('F-08: second check-in -> 409 ALREADY_CHECKED_IN', dup.status === 409 && dup.json?.error?.code === 'ALREADY_CHECKED_IN', `${dup.status} ${dup.json?.error?.code}`);
const roster = await org.req('GET', `/api/organizer/events/${ev.id}/registrations`);
log('roster ->', roster.status, roster.json?.data && { active_count: roster.json.data.active_count, checked_in_count: roster.json.data.checked_in_count });
check('F-08: roster checked_in_count 1', roster.json?.data?.checked_in_count === 1);
const own = await pa.req('GET', `/api/my/registrations/${regId}`);
log('participant.a own registration ->', own.status, own.json?.data && { id: own.json.data.id, status: own.json.data.status, checked_in_at: own.json.data.checked_in_at });
check('F-08: participant sees own checked_in_at (same as check-in response)', own.json?.data?.checked_in_at === ok.json?.data?.checked_in_at);
const sum = await org.req('GET', `/api/organizer/events/${ev.id}/summary`);
log('summary after check-in ->', sum.status, sum.json?.data);
check('F-09: summary ACTIVE 1, CANCELLED 0, checked-in 1, rate "100.00"', sum.status === 200 && sum.json.data.active_count === 1
  && sum.json.data.cancelled_count === 0 && sum.json.data.checked_in_count === 1 && sum.json.data.attendance_rate === '100.00');
const s403b = await pa.req('GET', `/api/organizer/events/${ev.id}/summary`);
check('API 403: participant GET summary of new event', s403b.status === 403, `${s403b.status} ${s403b.json?.error?.code}`);

const failed = results.filter(r => !r.ok).length;
log(`# finished ${stamp()}: ${results.length - failed} passed, ${failed} failed`);
log(`# smoke event id ${ev.id}, registration ${regId}`);
writeFileSync(process.argv[3], out.join('\n') + '\n');
if (out.join('\n').includes(PASSWORD)) { writeFileSync(process.argv[3], 'REMOVED: log contained the password\n'); throw new Error('password leaked into log; log removed'); }
