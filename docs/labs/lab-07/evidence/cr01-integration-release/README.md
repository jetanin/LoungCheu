# CR-01 combined integration - #87

Owner: Jetanin Naitho (jetanin); reviewer: Paphangkorn Luanseng (i3artuf).
Execution: automated commands through Codex in Jetanin's workspace on 28 Nov 2026.
Status: LOCAL INTEGRATION PASS; release/CI review/deployment/tag/live checks pending.

## Version chain

| Stage | Identity |
|---|---|
| Contract #100 | 079397267e354e4c9dd8034d5652cf191fd49361 |
| API RED / GREEN | 4ab6ccf816e002167350594f19eb26aef889ad45 / 90d03039efe6a545addac1bb67149210b83219b6 |
| API #101 staging merge | 11325474dd2b20512f0fe846ec7e85a0ca2d8a77 |
| UI #102 RED / GREEN | 36f049b338a33693b0404ecc646e19ef0c1bc498 / 596c53b1b2b8f526b5700232473def8e9d96c368 |
| UI reviewed head | c1a48452f83f82b78462f3534bc76ad3ab2b41b8 |
| Combined staging / UI #102 merge | e56b3d917dfa08d0e6b7c8bb46be69a6625bd73d |
| Integration working tree | Combined source above plus new test-only browser coverage; application code unchanged |

The earlier API/client results remain historical evidence. All results below are
actual runs on this combined checkout. The first browser run contains the existing
43 cases; three new integration cases were then added and all 46 browser cases
were run. This is a coverage addition on already implemented behavior, not a new
TDD RED sequence. The new file's SHA-256 is retained in results.json.

## Actual verification

| Evidence | Scope | Result |
|---|---|---|
| [Environment](test-db-setup.log) | Docker Desktop/test container startup; empty disposable DB migration | 4 project migrations applied successfully; no reset/drop |
| [Server](typecheck-server.log), [client](typecheck-client.log), [tools](typecheck-tools.log), [new browser tests](typecheck-tools-coverage.log) | TypeScript checks | All exit 0 |
| [Focused CR-01](focused-cr01.log) | Real API/DB + client model/component | 4 files; 72 passed, 0 failed/skipped |
| [Regression](regression-vitest.log) | Full Vitest including S1-S3 and CR-01 | 39 files; 434 passed, 0 failed/skipped |
| [Client build](build-client.log), [server build](build-server.log) | Production builds | Both exit 0 |
| [Compiled smoke](compiled-smoke.log) | SPA, DB health/version, readiness, unknown API JSON | 4 passed |
| [Existing browser suite](browser-e2e.log) | Combined e56b3d9 before coverage additions | 43 passed, 0 failed/skipped |
| [Browser with additions](browser-e2e-coverage.log) | Full Chromium suite including 3 new #87 cases | 46 passed, 0 failed/skipped |
| [Initial source audit](source-audit-all.json), [coverage audit](source-audit-browser.json) | Source/test stability during runs | Unchanged during each run; application/schema source same between phases |

Exact commands, Node version and UTC start/end timestamps are in logs and
[command records](commands-all.json) / [coverage command records](commands-browser.json).
Bangkok time is UTC+07:00. Tests use synthetic accounts and data in Docker
127.0.0.1:55433 / loungcheu_test; browser ports remain 5173 and 3001.

Initial preflight found Docker stopped, then found the test database had no public
tables. The recorded migration setup was only for that verified-empty disposable
database. The retained port-5432 database and deployed database were not used.
This is not a manual teammate clean reproduction and does not close TEST-35/GAP-02.

## What the integration establishes

- Existing #102 browser/DB TEST-52 verifies legacy title ab, capacity 3 -> 4,
  exact PATCH without title, HTTP 200 and the unchanged title after reload/GET/DB.
- New tests/e2e/lab7-integration.spec.ts exercises padded abc / three emoji through
  actual UI POST and PATCH, checks normalized request bodies, statuses and saved
  GET values after reload. Another case rejects 121 emoji without POST, then saves
  exactly 120 emoji through the browser. Synthetic created DRAFTs are cleaned up.
- API tests verify rejection without insert/partial write, Unicode boundaries,
  role/auth/CSRF/ownership, and legacy publish/register. Existing full regression
  retains domain transitions and cross-feature behavior.

[results.json](results.json) maps INT-01..09 to actual automated assertion evidence
and states the scope of component versus real-browser observations. LIVE-01..06
remain NOT_EXECUTED; fixture UUIDs were not separately retained in the logs.
Case evidence IDs are EV-L7-I-01..09; automated scopes use EV-L7-I-TYPE,
EV-L7-I-FOCUS, EV-L7-I-10 (Vitest), EV-L7-I-11 (build), EV-L7-I-SMOKE
and EV-L7-I-12 (browser), with exact evidence files mapped in results.json.
Developer automation is not independent acceptance. No application or existing
test assertion was changed to obtain these results.

## Remaining #87 work

1. Commit this test/evidence addition, open the integration PR, obtain substantive
   teammate review and required CI on the exact new head, then merge staging.
2. Open reviewed staging -> main release PR. Use Refs #87 so it stays open for
   deployment work; merge with Create a merge commit and keep staging.
3. Preserve main merge SHA, deploy test job and migration execution, image and
   Cloud Run revision. CR-01 has no new migration but the pipeline migrate step
   still must succeed.
4. Compare /api/ready against the FULL main merge SHA; run selected changed and
   preserved paths on the actual deployed version and retain actual outcomes.
   verify-readiness.mjs is a read-only helper for readiness only, not feature UAT.
5. Agree a new tag and create it on the assessed main SHA after successful checks.
   Collect evidence for #88 metrics / #89 PDF. Do not move historical tags.

Local compiled readiness smoke does not prove deployed readiness, and readback
after saving does not prove data survived a restart/redeploy. No production
restart/deploy, tag, independent UAT or overall Product DoD acceptance is claimed.
All Git commands, commits and pushes remain the user's responsibility.
