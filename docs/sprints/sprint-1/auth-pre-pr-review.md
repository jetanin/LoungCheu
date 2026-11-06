# F-01 pre-PR review — 6 November 2026

Scope: setup + Issue #1 / F-01, AC-01–05 against accepted contracts/STS v0.5. Reviewed by Codex (AI assistance); this is not teammate approval. Requirements and AC IDs are unchanged.

This records the pre-rename verification. The user subsequently renamed workspaces to `server/client`; navigation links below point to current files, while the saved logs/manifests retain their original paths. Latest layout verification and the pending user-owned database connection are in [server/client local DB record](server-client-local-db.md).

## Findings and corrections

| Finding | Correction | Verification |
|---|---|---|
| P1: overlapping `/me` requests could restore private identity when an older 200 arrived after a newer 401 | [App](../../../client/src/app/App.tsx) advances the request generation for every check and ignores superseded responses; persisted `pageshow` clears identity and rechecks | Browser regression failed with 2 private-name elements instead of 0 before correction; both stale-response and restored-page cases now pass |
| P2: unsupported JSON charset returned 500 instead of contract 400 | [Error handler](../../../server/src/shared/errors.ts) normalizes typed body-parser errors with 400/413/415 status into `400 INVALID_INPUT` | API regression red: expected 400, actual 500; now PASS |
| P2: PostgreSQL URLs without a host/database passed configuration validation; test guard matched text in a query string | [Database URL validation](../../../server/src/config/database-url.ts) parses the URL and checks its actual pathname for the dedicated `loungcheu_test` target; all test entry points share the guard | Two config assertions failed before correction; config/database-target unit cases now pass |
| P2: production SPA fallback failed under a hidden ancestor directory such as `.local` | [App composition](../../../server/src/app.ts) uses `sendFile('index.html', { root: frontend })`, keeping Express dotfile protection while resolving the fixed filename within the build root | Clean-install copy initially built successfully but `/login` smoke returned 500; rebuilt copy and main source now both pass the 3-check smoke |
| P2: expired sessions were never pruned; pool cleanup was not awaited | Store uses a 15-minute base prune interval, generic pool/store error logging and awaited shutdown | Expired infrastructure fixture is removed while an active login remains valid; app recreation preserves a real PostgreSQL-backed session |
| P2: user/password changes in one API case could leak into later fixtures | [API tests](../../../server/tests/integration/auth.test.ts) restore account state transactionally before each case; generic-500 test now injects failure into the actual application health dependency | 31 real-PostgreSQL API cases pass, including cross-user isolation, tampered cookie, app recreation and cleanup |
| P3: root env template referred to another project; feature/tooling/DoD status text was stale | Root/backend templates now agree on safe LoungCheu runtime values and explain which env file is loaded. README, SRS/SDS, feature inventory, decisions, plan, STS/DoD, traceability and evidence records now distinguish F-01 verification from unfinished Sprint 1/release work | Env ignore/private-value scan and local Markdown link/manifest checks recorded with this review |

## Executed verification

Tested code for this historical pre-PR run was the uncommitted working tree on `feature/auth`, parent `53959423ca34e08d9b9869d4ea200b961e60f5bb`. [Source manifest](../../deliverable-1/evidence/auth/pre-pr-green/sha256.txt) identifies that version; the parent commit is not an implementation test commit.

| Check | Result | Evidence |
|---|---|---|
| `npm.cmd test` | **54 passed**, 0 failed/skipped: 31 API/DB + 23 unit, 4 files | [tests.log](../../deliverable-1/evidence/auth/pre-pr-green/tests.log) |
| `npm.cmd run test:e2e` | **7 passed**, 0 failed/skipped, Chromium 156.0.8078.4 | [e2e.log](../../deliverable-1/evidence/auth/pre-pr-green/e2e.log) |
| `npm.cmd run typecheck` | PASS: backend, frontend, tools/config/E2E | [typecheck.log](../../deliverable-1/evidence/auth/pre-pr-green/typecheck.log) |
| `npm.cmd run build` | PASS: client/backend | [build.log](../../deliverable-1/evidence/auth/pre-pr-green/build.log) |
| `npm.cmd run test:built` | **3 checks passed**: SPA `/login`, real DB health/version, unknown API JSON 404 | [built-smoke.log](../../deliverable-1/evidence/auth/pre-pr-green/built-smoke.log) |
| Fresh dependencies in ignored source copy: `npm.cmd ci` | PASS; no `node_modules` or build output copied | [clean-install.log](../../deliverable-1/evidence/auth/pre-pr-green/clean-install.log) |
| Copy: generate, test migration, typecheck, unit/API tests, client/backend build | PASS; 54 tests. Migration reports no pending migrations on the existing isolated test DB | [captured output tail](../../deliverable-1/evidence/auth/pre-pr-green/reproduction-checks-tail.log); initial generate/migrate output was shown in tool execution |
| Copy: backend rebuild + compiled smoke after SPA correction | PASS; **3 smoke checks** | [reproduction-build-fix.log](../../deliverable-1/evidence/auth/pre-pr-green/reproduction-build-fix.log), [reproduction-smoke-fix.log](../../deliverable-1/evidence/auth/pre-pr-green/reproduction-smoke-fix.log) |
| `npm audit --json --fetch-retries=0` | **0 vulnerabilities**, exit 0; dependency versions/lockfile unchanged during this review | [audit.json](../../deliverable-1/evidence/auth/pre-pr-green/audit.json) |
| Source/evidence consistency and Git-visible file checks | **45 source/config files** match the manifest and the dependency-reproduction copy; 0 missing local Markdown targets, 0 private-config value matches, 0 source trailing-whitespace findings; `git diff --check` passed and private env/data files are not tracked | [consistency.json](../../deliverable-1/evidence/auth/pre-pr-green/consistency.json) |

Fresh dependency reproduction reused the existing isolated PostgreSQL test database. It does not prove setup on a fresh machine/database or independent teammate reproduction. App-recreation persistence is an automated object-lifecycle test, not a manual process-restart/domain-registration acceptance test.

## TDD and preserved failures

- Original fixed-expiry red→green remains in [auth evidence](../../deliverable-1/evidence/auth/README.md); its 38-test/5-browser green result is historical.
- [Pre-PR red source](../../deliverable-1/evidence/auth/pre-pr-red/sha256.txt), [unit/API log](../../deliverable-1/evidence/auth/pre-pr-red/tests.log): **38 passed, 3 failed** (unsupported charset and two invalid config URLs).
- [Pre-PR browser red](../../deliverable-1/evidence/auth/pre-pr-red/e2e.log): selected stale-response scenario **1 failed**; expected no private identity, actual name remained in two elements.
- [Clean-copy smoke failure](../../deliverable-1/evidence/auth/pre-pr-green/reproduction-checks-tail.log) is retained alongside the successful correction. One intermediate retry still used the old source because its copy destination was relative to the wrong working directory; [retry log](../../deliverable-1/evidence/auth/pre-pr-green/reproduction-smoke-copy-error.log) is retained, then source hashes were confirmed equal and smoke rerun successfully.
- Initial environment/browser-install failures remain under `evidence/auth/attempts/`. They are not counted as intended rule failures or erased by green results.

## Git, PR and remaining work

Fetched origin during review: `origin/sprint-1-staging` is still `5395942`. Feature HEAD is the same commit (0 committed ahead/behind); implementation files are modified/untracked. GitHub API still reports Issue #1 open, empty body and no assignees; no open feature PR was found. No remote write, commit, push or PR creation was performed by this review.

Before opening the feature PR: confirm the actual owner and Issue scope/contract links, commit the reviewed code/evidence, push `feature/auth`, and target **`sprint-1-staging`**. Request a real teammate review; no self-approval. [Auth work record](auth-work-record.md) contains the proposed scope.

F-01 local code/checks are ready for that review. Sprint 1 is not Done: F-02–05, registration/ownership endpoint matrix, domain concurrency/TDD, full journey, independent reproduction, reviewed integration and main release remain pending. Docker/CI/GCP remain Lab 5 work; no deployment check is claimed here.
