# F-01 execution evidence — 6 November 2026

Branch `feature/auth`; parent `53959423ca34e08d9b9869d4ea200b961e60f5bb` (accepted baseline PR #5). **Tested implementation is an uncommitted working tree**, identified by source SHA256 manifests, not by the parent commit. No feature push/PR/review/main release has been performed in this session.

**Latest execution uses one PostgreSQL instance on 5432:** [single-instance record](../../../sprints/sprint-1/single-instance-db.md), [current source manifest](single-instance/sha256.txt), [test DB setup](single-instance/setup.log), [test migration](single-instance/migrate-test.log), [54 unit/API PASS](single-instance/tests.log), [7 browser PASS](single-instance/e2e.log), [typecheck](single-instance/typecheck.log), [build](single-instance/build.log), [compiled smoke](single-instance/built-smoke.log), [actual app-DB auth smoke](single-instance/local-db-smoke.log), [DB targets/app user preservation](single-instance/database-state.json), [legacy shutdown](single-instance/stop-legacy.log). App `loung-cheu-database` and test `loungcheu_test` are separate databases on localhost:5432. Cluster 55432 was stopped with its data retained. No demo/DB password is included in evidence.

The earlier [application DB migration/seed](../../../sprints/sprint-1/server-client-local-db.md) and [local-db-migrated manifest](local-db-migrated/sha256.txt) remain historical. That phase removed the redundant root env template and verified the app DB; the latest phase changes the test instance and setup helper.

The earlier [rename-phase manifest](server-client/sha256.txt) and associated results remain historical; its pending-auth state was resolved before the latest migration/testing above.

Earlier [pre-PR review/corrections](../../../sprints/sprint-1/auth-pre-pr-review.md), [pre-rename manifest](pre-pr-green/sha256.txt), [fresh dependency install](pre-pr-green/clean-install.log) and [audit: 0 vulnerabilities](pre-pr-green/audit.json) are preserved. `green/` is the initial 38-test/5-browser result. These manifests identify historical versions, not the renamed current tree. Do not overwrite historical evidence to make it match new source.

## Environment and fixtures

Windows, Asia/Bangkok; Node.js 22.16.0, npm 11.11.0, PostgreSQL 17.6; Prisma/client/adapter 7.10.1, Express 5.3.0, express-session 1.19.0, connect-pg-simple 10.0.0, Vitest 5.1.0, Playwright 1.64.1. Exact dependency graph: root package-lock.json.

Current PostgreSQL instance is localhost:5432 with separate `loung-cheu-database` and `loungcheu_test`; initial results used an isolated project cluster on 55432 with `loungcheu_test`/`loungcheu_dev`, now stopped and retained as historical data. SCRAM credentials/private env are ignored by Git. Tests use synthetic PA/PB/PC/OA/OB/IX; passwords generated in-process without printing them. TEST-06 uses injected application clock `t0=2026-11-06T03:00:00.000Z`, `expiry-1ms`, `expiry`, `expiry+1ms`; authentic cookie/bootstrap/login and PostgreSQL session store are exercised without modifying stored sessions to bypass authentication.

Executor: Codex in the shared workspace (AI assistance), not an independent teammate tester/reviewer. Human contribution, feature review and clean reproduction remain pending.

## Meaningful TDD — TEST-06 / AC-03

1. [Red source/manifest](red-expiry/sha256.txt), [guard](red-expiry/auth.ts.txt), [test source](red-expiry/auth.test.ts.txt), [app](red-expiry/app.ts.txt), [raw result](red-expiry/run.log).
2. Actual command: `npm run test:auth -- -t 'TEST-06 rejects at absolute expiry'`. The PowerShell npm wrapper consumed `-t` and warned; Vitest ran the full 25-case API suite. Result: **24 passed, 1 failed, exit 1** at 01:22:07 Asia/Bangkok. Intended assertion: copied cookie at fixed expiry must receive 401; actual response was 200. This is the rule failure, not a setup/compiler failure.
3. Correction: `requireAuth` checks server-side `expiresAt` on each protected request and destroys the expired server session before returning `401 AUTH_REQUIRED`. Activity before expiry never extends the deadline.
4. [Initial green source/manifest](green/sha256.txt), [guard](green/auth.ts.txt), [test source](green/auth.test.ts.txt), [full unit/API result](green/tests.log). Initial result: **38 passed, 0 failed, 0 skipped**, across 3 files (26 API/DB + 12 unit). The red snapshot has 25 API tests; the initial green suite additionally verifies seed idempotency and extends EmptyInput cases. Latest 54-test result and additional pre-PR red→green findings are linked above.

## Initial commands actually executed (historical result)

| Command | Actual outcome | Log |
|---|---|---|
| `npm run db:generate` | Prisma Client 7.10.1 generated | Tool execution; no saved log |
| `npm run db:migrate:test` | Applied `202611060001_auth` to `loungcheu_test` | Tool execution; no saved log |
| `npm run db:migrate` | Same migration applied to separate dev DB | [migrate-dev.log](green/migrate-dev.log) |
| `npm run db:seed` | CLI seeded six synthetic dev accounts with process-only random password; credentials omitted | [seed-dev.log](green/seed-dev.log) |
| `npm.cmd test` | 38 passed, 0 failed, 0 skipped | [tests.log](green/tests.log) |
| `npm.cmd run typecheck` | Backend/frontend/tools/config/E2E TypeScript passed | [typecheck.log](green/typecheck.log) |
| `npm.cmd run build` | Frontend/backend build passed | [build.log](green/build.log) |
| `npm.cmd run test:built` | 3 assertions passed: built SPA /login, DB health/version, API JSON 404 | [built-smoke.log](green/built-smoke.log) |
| `npm.cmd run test:e2e` | **5 passed**, 0 failed, 0 skipped, Chromium 156.0.8078.4 revision 1248 | [e2e.log](green/e2e.log) |
| `npm audit --json --fetch-retries=0` | **0 vulnerabilities**, exit 0 | [audit.json](green/audit.json) |

Browser cases: PA/OA Login→refresh→Logout→browser back; invalid form/generic credentials/pending submit; expired-session UI clearing; failed Logout clears private UI and retries successfully. Screenshots captured by the real browser: [Login](green/login.png), [authenticated Participant](green/participant.png). These show F-01 only; the events panel states that event listing is still under development.

## Failed attempts and limitations

- First typecheck failed on implicit `any[]` in a test; corrected to `unknown[]`, then rerun successfully. This is not TDD rule evidence.
- Windows sandbox prevented initial PostgreSQL startup and tsx's `os.userInfo` (`uv_os_get_passwd ENOMEM`). Retried setup outside the sandbox with approval; isolated DB/API tests then ran. [Initial E2E sandbox failure](attempts/e2e-sandbox.log).
- Initial browser execution could not launch any of its 4 cases because the matching Chromium revision 1248 was absent. [Missing-browser launch failure log](attempts/e2e-missing-browser.log). These 4 failures do not represent UI behavior results; they are retained even after rerun. A fifth case (logout failure/retry) was added before initial green E2E execution; pre-PR verification expanded the suite to 7.
- Initial npm audit reported 6 dependency vulnerabilities. Upgraded Prisma/client/adapter to 7.10.1 and Vitest to 5.1.0 and removed unused test dependencies; installation then reported 0. No forced audit fix was used.
- No teammate clean reproduction, manual UI acceptance, full event/registration journey, domain data restart check, registration concurrency, deployment or application main release has been completed here. F-02–05 and the full TEST-32 resource/UUID matrix remain pending.
- Expired-session browser UI scenario intercepts `/me` to return 401; actual server expiry proof is the separate PostgreSQL TEST-06 above. Built smoke uses Supertest against compiled artifacts and does not claim a deployed HTTPS check.
- All working tree test versions require an implementation commit before a feature PR. Keep source manifests/results with that commit and run any checks warranted by subsequent changes. Assignments in the sprint plan are proposals; no GitHub assignee was set here.
