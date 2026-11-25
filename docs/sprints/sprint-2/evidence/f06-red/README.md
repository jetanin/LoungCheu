# F-06 — initial RED evidence (Issue #47)

Executed 24 November 2026, approximately 01:42–01:44 Asia/Bangkok.
Contract/test-design reference: Sprint 2 v0.5, AC-28–33 / TEST-37–44.
This is the first API test slice, not completion of the whole F-06 STS.

## Environment and scope

- Existing Docker Compose `db` service, PostgreSQL on localhost:5432.
- Database: `loungcheu_test`, checked by both the URL guard and `current_database()` before creating fixtures.
- Existing Sprint 1 migrations only; no F-06 schema, service, route or client implementation changes in this step.
- Uses real sessions, CSRF tokens and PostgreSQL; random synthetic users/event IDs; cleanup is limited to this suite's records.
- `.env.test` is unchanged. No credentials, cookies or session tokens are retained here.
- A temporary `db-test` container on 55433 was started during setup, then stopped. The retained executions below use the original 5432 service.

## Commands and actual results

Run from the repository root:

```powershell
npm.cmd run db:migrate:test
npm.cmd test -- server/tests/integration/registration.test.ts --reporter=verbose
npm.cmd test -- server/tests/integration/registration-lifecycle.test.ts --reporter=verbose
npm.cmd run typecheck
```

| Check | Result | Evidence |
|---|---|---|
| Existing migrations on loungcheu_test:5432 | No pending migrations | Command output observed during setup |
| Sprint 1 registration baseline | 17 PASS, 0 FAIL/SKIP; exit 0 | [baseline log](sprint1-registration-baseline.log) |
| Initial F-06 lifecycle slice | 0 PASS, 9 FAIL, 0 SKIP; exit 1 | [RED log](registration-lifecycle-red.log) |
| Typecheck (server, client, tools) | PASS; exit 0 | [typecheck log](typecheck.log) |

The nine failures reach HTTP assertions: cancel/close currently return 404 while the contract requires 200, 409 or 401 depending on the case. Authentication, fixtures and existing registration requests succeed. These retained failures are not syntax errors, missing dependencies or database-setup failures. Earlier failed environment probes were not counted as RED.

## Tests in this slice

- TEST-37: PB gets EVENT_FULL before PA cancels; after successful cancel the same last seat must become available to PB.
- TEST-38: two cancel/reactivate cycles must reuse the reference and first registration time and retain five history entries.
- TEST-39: three deadline offsets for close; registrations/history remain and a repeated close is rejected.
- TEST-40: three deadline offsets for cancel and unchanged records after rejection.
- TEST-41: auth/role/ownership/CSRF checks for the new mutations.

Assertions after each first failure are planned checks, not executed/passing evidence. The history table is queried only after a successful lifecycle response, so its current absence is not the recorded RED cause.

## Next steps and version recording

The user runs all Git commands. Record the baseline SHA before committing and the separate RED commit SHA after committing; use those actual values in the D2 evidence/version table. No SHA is inferred from a branch name, and no Git command was run by the assistant in this step.

After the RED commit is recorded, implement the relevant migration/API behaviour and run these same tests for GREEN. Subsequent slices must cover the remaining input/error matrix, lock races, seed/backfill/rollback, UI and persistence including an actual process restart (NFR-03). TEST-44(c) is reserved for a separate integration PR after both #47 and #48 merge; close→PATCH remains TEST-47 on the F-07 side.
