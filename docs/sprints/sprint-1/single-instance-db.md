# One PostgreSQL instance — 6 November 2026

User request: use the existing PostgreSQL instance on port 5432 for both application and tests. Contracts/AC v0.5 are unchanged; application and test **databases** remain separate.

| Purpose | Database | Instance |
|---|---|---|
| Application | `loung-cheu-database` | `localhost:5432` |
| Automated tests | `loungcheu_test` | `localhost:5432` |

`server/.env` was preserved. Private `.env.test` now derives host/port/credentials from the app connection with only the database changed. The previous test configuration is backed up under ignored `.local/test-env-before-single-instance.env`. Credentials are omitted from all evidence.

## Implementation and setup

- `npm run db:setup:test` uses `scripts/setup-test-db.mjs` to create `loungcheu_test` if absent and prepare `.env.test`. Reuse of a nonempty database requires migration history matching this project. The helper does not alter application data or start a PostgreSQL cluster.
- `npm run db:migrate:test` applied `202611060001_auth` to the new test DB. Running setup again succeeded with `created=false` and preserved the same configuration/target.
- `.env.test.example`, README, STS/SDS and active execution records now use the single instance. `scripts/local-db.ps1` remains a compatibility wrapper for test-DB setup; old start/stop parameters and cluster creation are removed.
- The legacy cluster's resolved directory and PID-file port were checked before stopping it: `.local/postgres`, port 55432. `pg_ctl` confirmed shutdown, 55432 no longer responds, and the 5432 service remains available. Legacy data was retained; no database or data directory was deleted.

## Actual verification

Source: uncommitted `feature/auth`, parent `53959423ca34e08d9b9869d4ea200b961e60f5bb`; executor Codex (AI assistance). [Current source manifest](../../deliverable-1/evidence/auth/single-instance/sha256.txt).

| Check | Actual result | Evidence |
|---|---|---|
| Setup new test DB | PASS; `created=true`, target localhost:5432/loungcheu_test | [setup.log](../../deliverable-1/evidence/auth/single-instance/setup.log) |
| Test migrations | PASS; applied `202611060001_auth` | [migrate-test.log](../../deliverable-1/evidence/auth/single-instance/migrate-test.log) |
| Repeat setup | PASS; `created=false`, no schema/data reset | [setup-repeat.log](../../deliverable-1/evidence/auth/single-instance/setup-repeat.log) |
| Unit/API/DB tests | **54 PASS**, 0 fail/skip, new test DB | [tests.log](../../deliverable-1/evidence/auth/single-instance/tests.log) |
| Typecheck/build | PASS, server/client/tools | [typecheck.log](../../deliverable-1/evidence/auth/single-instance/typecheck.log), [build.log](../../deliverable-1/evidence/auth/single-instance/build.log) |
| Stop old cluster | PASS; port 55432 closed, 5432 available; data retained | [stop-legacy.log](../../deliverable-1/evidence/auth/single-instance/stop-legacy.log) |
| Browser E2E after legacy shutdown | **7 PASS**, 0 fail/skip, new test DB | [e2e.log](../../deliverable-1/evidence/auth/single-instance/e2e.log) |
| Built app smoke after legacy shutdown | **3 checks PASS**, using new test DB | [built-smoke.log](../../deliverable-1/evidence/auth/single-instance/built-smoke.log) |
| Actual application DB auth smoke after legacy shutdown | PASS: health, anonymous rejection and both-role Login/Identity/Logout | [local-db-smoke.log](../../deliverable-1/evidence/auth/single-instance/local-db-smoke.log) |
| Database targets/app data protection | Both `inet_server_port()` results are 5432, test migration completed; before/after SHA256 of all app User rows matches (6 rows) | [database-state.json](../../deliverable-1/evidence/auth/single-instance/database-state.json) |

Initial test migration inside the Windows sandbox failed because tsx could not read the user profile (`uv_os_get_passwd ENOMEM`); [failure log](../../deliverable-1/evidence/auth/single-instance/migrate-test-sandbox.log) is preserved. It succeeded outside the sandbox with approval. The sandbox also could not see the legacy user process; the approved shutdown outside the sandbox verified the expected directory/port before stopping it. These environment issues are not TDD rule failures.

Previous evidence directories identify earlier source/config versions. No teammate approval, independent fresh-machine reproduction, full Sprint 1 acceptance or main release is claimed by this instance switch. Feature commit/push/PR and the remaining F-02–05 work are unchanged.
