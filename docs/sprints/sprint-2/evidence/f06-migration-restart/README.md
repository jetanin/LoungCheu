# F-06 — migration/rollback verification and actual process restart

Executed 24 November 2026, approximately 12:06–12:10 Asia/Bangkok.
References: TEST-44(a/b), NFR-03 persistence, and the TEST-43 readback scope.

## Source and status

Source before these test additions: user-supplied commit **`27a8804a9202f48227b80cd38ca1f4c8d26cff2c`**.

**Current result: 8 PASS, 1 FAIL (RED), 0 SKIP.** The failing case exposes a real migration diagnostic problem: the migration refuses legacy CANCELLED data, but the actual Prisma CLI hides the reconciliation reason behind `current transaction is aborted`. This step adds tests/helpers/evidence only; the migration implementation has not yet been changed. The user must commit this RED before the corrective GREEN step and record the SHA. The assistant ran no Git commands.

## Isolated environment and cleanup

All local database operations run on the user-approved Docker instance at **55433**. A guarded helper first verifies the administrative database is `loungcheu_test`, creates only random names matching `loungcheu_test_f06_[a-f0-9]{32}`, and drops only names it created. It never resets the original 5432 data or an application database. DROP does not use FORCE; callers close their clients/processes first. The helper also supports this repository's ephemeral GitHub Actions PostgreSQL service, gated by both GITHUB_ACTIONS=true and CI=true; that CI path has not been executed locally.

Sprint 1-only migration directories are temporary copies of the two real migration files. The Prisma CLI applies these versions first, then the actual full migration directory. Temporary filesystem cleanup validates its resolved target is an owned child of `.local/verification` before recursive removal.

[Cleanup check](cleanup.log) after both runs: **0 remaining temporary databases**. Backend child processes were stopped. `.env.test` and the original 5432 data were unchanged.

## TEST-44(a): migration and seed

- **PASS:** Actual S1→S2 CLI deployment with two existing ACTIVE registrations retains references, ownership, statuses, first timestamps (including milliseconds), Event fields and row counts. Backfill produces one REGISTERED entry per old record with the correct actor/time and distinct UUIDs. History index/FK behaviour is checked. Repeated `migrate deploy` does not duplicate backfill.
- **RED:** With legacy CANCELLED data lacking cancelled_at, the CLI exits nonzero and the test confirms old Registration rows are unchanged, cancelled_at was not added, and no history table was created. However, stdout/stderr does not contain the required reconciliation explanation. It instead reports `ERROR: current transaction is aborted, commands ignored until end of transaction block`. This is the final failing assertion, after the preservation assertions have executed.
- **PASS:** Fresh database→actual migrations→actual `server/prisma/seed.ts` creates six demo events, four registrations and four matching REGISTERED entries. Repeated seed and concurrent reruns preserve the exact records/history.
- **PASS:** Two actual seed processes starting against a fresh migrated database also produce only six events/four registrations/four matching history entries.

## TEST-44(b): transactional history failure

Each test uses a database-local INSERT trigger that deliberately fails history writes, with no public fault endpoint or production injection code.

- **PASS:** Create, cancel and reactivate each return the generic HTTP 500 envelope; Event/Registration/history snapshots remain exactly as before the failed mutation, including timestamps and counts.
- **PASS:** Removing only the injected trigger lets the same operation succeed and append exactly one history entry, establishing the injected failure as the cause.
- **PASS:** Demo-event seed also rolls back newly created events/registrations/history on history failure while preserving previously seeded users. Removing the injected fault allows the normal six-event/four-registration/four-history seed.

## NFR-03: real compiled backend restart

The test compiles the actual server entry point, spawns `node server/dist/server.js` with its own loopback port, logs in through real HTTP/cookies/CSRF, and drives create→publish→register→cancel. It then stops that OS process, checks the old listener is unavailable, starts a different process on the same port, and verifies CANCELLED/reference/first timestamp/cancelled_at/roster/history through fresh logins. It also checks the prior session still reads from PostgreSQL.

Next it reactivates the same reference, closes the Event, stops the second process, starts a third and verifies ACTIVE/cancelled_at=null, CLOSED, seat counts and the same three history rows. A rejected cancel after restart adds no history. There is no migration, reseed or data reset between starts.

Retained run:

| Instance | PID | Result |
|---|---:|---|
| First compiled backend | 41668 | REGISTERED then CANCELLED; stopped |
| Second compiled backend | 6416 | Cancelled state read back, then reactivated and CLOSED; stopped |
| Third compiled backend | 7244 | Active/CLOSED/reference/count/history read back; stopped |

The log records **3 distinct processes, 2 stop/restart cycles, 1 Registration row and 3 history rows**. Readiness uses a unique synthetic version marker per instance to ensure requests reach the intended new process; those markers are not release tags or deployed commit SHAs. On Windows, child SIGTERM may terminate the process directly; the test observes process exit and listener unavailability before starting the next one. This proves backend process persistence, not a Docker/GCP redeployment or independent UAT acceptance.

## Commands and retained results

From the repository root with a process-only test URL override for the approved 55433 target (credentials omitted):

```powershell
npm.cmd test -- server/tests/integration/registration-lifecycle-migration.test.ts server/tests/integration/registration-lifecycle-restart.test.ts --reporter=verbose
npm.cmd run typecheck
```

| Check | Actual result | Evidence |
|---|---|---|
| First migration/restart run | 8 PASS, 1 FAIL, exit 1 | [First run](migration-restart-first-run.log) |
| Retained run with preservation assertions before the diagnostic assertion | 8 PASS, 1 FAIL, exit 1 | [RED/verification log with PIDs](migration-restart.log) |
| Typecheck | PASS, exit 0 | [Typecheck](typecheck.log) |
| Temporary database cleanup | 0 remaining | [Cleanup](cleanup.log) |

## Next step

Commit the diagnostic RED test before changing the migration, correct the operator-facing reconciliation failure, then run these same tests for GREEN. Full F-06 browser lifecycle/UI edge coverage, completion/traceability/System SDS updates, CI/review/release work and the separately agreed TEST-44(c) integration PR are still outstanding. No PR, merge, deployment, Issue closure or Kanban change occurred in this step.
