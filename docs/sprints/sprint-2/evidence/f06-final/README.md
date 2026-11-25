# F-06 — final local regression and documentation reconciliation

Executed 24 November 2026 (Asia/Bangkok). Source supplied by user before this
step: `ba89488079a2c884735a18642dbd7487b6872559`. No Git commands were executed
by the assistant. This step changes completion/traceability/System SDS and
contract/STS status documentation, records logs, updates one historical
browser fixture with `cancelled_at:null`, and adds failure-state diagnostics to
the F-06 browser test. Production application code and all
previous RED assertions are unchanged. The eventual documentation/fixture
commit SHA must be added to the PR by the user.

## Results

| Check | Actual result | Evidence |
|---|---|---|
| Full Vitest regression | **242 PASS, 22 files, exit 0** | [Vitest](vitest.log) |
| Workspaces and tooling typecheck | PASS, exit 0 | [Typecheck](typecheck.log) |
| Typecheck after final browser-test diagnostics/fixture change | PASS, exit 0 | [Final typecheck](typecheck-final.log) |
| Client/server production build | PASS, exit 0 | [Build](build.log) |
| Compiled production app smoke | **4 PASS**, exit 0: SPA, health/version, readiness, unknown API JSON 404 | [Built smoke](built-smoke.log) |
| Final full Chromium regression | **38 PASS, 0 FAIL**, exit 0 | [Verified full run](chromium-verified.log) |
| F-06 targeted diagnostic repetitions | **3 PASS**, exit 0 | [Repeated journey](chromium-lifecycle-diagnostic.log) |
| Read-only disposable-database cleanup check | **0 remaining** | [Cleanup](cleanup.log) |

The final full Chromium run includes the original pending/success assertions
with the corrected S2 mock payload and the real F-06 lifecycle journey.

The full Vitest run includes the same actual compiled-backend restart test:
three distinct PIDs **43564, 55072, 57172** on the same test DB, two observed
stop/restart cycles, final one Registration and three history rows. Child
processes are stopped and the owned temporary database is dropped by the test.
The source includes 160 deterministic PostgreSQL lock races (8 groups ×20).
Detailed AC/test/source history is in [Sprint 2 completion](../../README.md).

## Browser fixture reconciliation

[First full Chromium run](chromium.log): **36 PASS, 2 FAIL**, exit 1. Both failures
are existing `events.spec.ts` focus/availability tests with mocked successful
registration responses. Their fixture lacked the now-required `cancelled_at`
field, so the client correctly treated the malformed response as uncertain and
did not display its reference. The real F-06 lifecycle journey passed.

Only `cancelled_at:null` was added to the shared successful mock payload. All
existing pending/success/focus/refresh assertions remain unchanged. This is
contract-compatible fixture maintenance, not a new product RED, and no
application code was weakened. The entire Chromium suite is rerun after it.

[The next full run](chromium-final.log) passed those two cases but had **37 PASS,
1 FAIL**: the real F-06 journey timed out waiting for participant B's register
button to become enabled despite one available seat. At that point the test
did not capture B's visible state, so the cause cannot be established from that
log. This is an unresolved intermittent observation, not a proven application
fix or a reason to weaken/skip the assertion.

The test now logs both participants' visible states only on failure. No action
logic, timeout limit, success assertion or application code was changed for
this observation. Three targeted repetitions then passed, followed by the full
38-test pass linked above. Retain the one-off timeout for teammate review and
revisit it if it reproduces; these later passes do not establish its root cause.

## Environment and reproducibility

Windows/PowerShell; dependency versions are pinned by the repository lockfile.
All DB work uses the approved Docker `loungcheu_test` at **127.0.0.1:55433** with
a process-only TEST_DATABASE_URL override. `.env.test` and legacy data on 5432
are unchanged. E2E uses API **3011**, UI **5183**, one Chromium worker and a
synthetic random password supplied by the existing Playwright configuration.

Commands, after selecting the approved test-only URL (credentials omitted):

```powershell
npm.cmd test -- --reporter=dot --maxWorkers=1
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:built
$env:E2E_WEB_PORT='5183'
$env:E2E_API_PORT='3011'
npm.cmd run test:e2e
```

Build ran after Vitest completed because the real restart test also compiles
the server. Full browser tests ran after the integration suite to avoid test
data-reset interference. Built smoke and browser tests ran concurrently; smoke
performs read-only production-route checks and does not reset fixture data.

## Acceptance limits

These are local checks. GitHub CI `test-and-docker`, its Linux/ephemeral-DB path
and Docker image build were not run by this step. Teammate review, staging
merge, board transition, accepted main release/tag/deployment and independent
UAT/clean reproduction are not established. TEST-44(c) is pending in a separate
integration PR after #47/#48 merge. AC-33 and whole Sprint 2 DoD must not be
marked complete from these results alone. Teammate TEST-47 must subsequently
exercise actual close→PATCH, not merely its earlier CLOSED fixture.
