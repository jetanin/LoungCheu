import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const usage = 'node verify-readiness.mjs --url HTTPS_READY_URL --expected-sha FULL_MAIN_SHA --tester "Name" --out OUTPUT_DIRECTORY';
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--help') { console.log(usage); process.exit(0); }
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--url', '--expected-sha', '--tester', '--out'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--') || options[args[i]]) {
    console.error(usage); process.exit(2);
  }
  options[args[i]] = args[i + 1];
}
if (!options['--tester']?.trim() || !options['--out'] || !/^[0-9a-f]{40}$/.test(options['--expected-sha'] ?? '')) {
  console.error('Required: tester, output directory and full lowercase 40-character main merge SHA.\n' + usage); process.exit(2);
}
let url;
try { url = new URL(options['--url']); } catch { console.error('A valid HTTPS /api/ready URL is required.'); process.exit(2); }
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api/ready') {
  console.error('Use an HTTPS /api/ready URL with no credentials, query or fragment.'); process.exit(2);
}
const started = new Date().toISOString();
let observed = null, httpStatus = null, serverDate = null, reason = null;
try {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
  httpStatus = response.status; serverDate = response.headers.get('date');
  const body = await response.json();
  // Retain only expected readiness fields; never store cookies/headers wholesale.
  const data = body?.data;
  observed = { status: data?.status ?? null, db: data?.db ?? null, version: data?.version ?? null };
  if (httpStatus !== 200) reason = `Unexpected HTTP status ${httpStatus}`;
  else if (observed.status !== 'ready' || observed.db !== 'connected') reason = 'Service or database not ready';
  else if (observed.version !== options['--expected-sha']) reason = 'Readiness SHA does not match assessed main merge SHA';
} catch (error) {
  reason = error instanceof Error ? error.name + ': readiness request failed' : 'Readiness request failed';
}
const result = { evidence_id: 'EV-L7-R-05', scope: 'readiness only; does not verify feature journeys, migration or Cloud Run revision',
  tester: options['--tester'], started_utc: started, finished_utc: new Date().toISOString(), url: url.toString(),
  expected_main_sha: options['--expected-sha'], http_status: httpStatus, server_date: serverDate,
  observed, result: reason ? 'FAIL' : 'PASS', reason };
await mkdir(options['--out'], { recursive: true });
const stamp = started.replace(/[:.]/g, '-');
const base = join(options['--out'], `EV-L7-R-05_readiness_${stamp}`);
await writeFile(base + '.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
await writeFile(base + '.txt', Object.entries(result).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n') + '\n', { flag: 'wx' });
console.log(result.result, 'readiness;', 'expected:', result.expected_main_sha, 'observed:', observed?.version ?? 'unavailable');
console.log('Evidence:', base + '.json');
process.exitCode = reason ? 1 : 0;
