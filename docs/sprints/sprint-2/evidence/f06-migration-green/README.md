# F-06 — migration diagnostic GREEN

Executed 24 November 2026 (Asia/Bangkok). RED source: user-supplied commit
`65bbadbcdfd0af9c83d274b699d4a0919eebd678`.

## Change and targeted verification

The read-only legacy CANCELLED precondition now runs before the explicit write
transaction. Previously, an exception inside BEGIN caused the actual Prisma CLI
to mask the reconciliation explanation with `current transaction is aborted`.
Schema changes and the REGISTERED backfill remain together inside BEGIN/COMMIT.
No test assertions were changed for GREEN.

[The same migration/restart tests](migration-restart-green.log) pass **9/9**,
including the operator-facing reconciliation message and preservation of legacy
rows/schema when migration is rejected. Coverage also includes actual S1→S2 CLI
backfill, fresh/concurrent seed history, transactional rollback and successful
retry after injected history failures.

The targeted run starts three compiled backend processes (PIDs 53728, 23968,
33228) and performs two actual stop/restart cycles. Readback preserves the same
Registration reference, timestamps, CANCELLED then ACTIVE/CLOSED state, and
three history rows. All child processes are stopped by the test.

## Environment and retained attempts

All database work uses the approved Docker test target **55433**, selected by a
process-only TEST_DATABASE_URL override. `.env.test` and original data on 5432
are unchanged. Migration tests create and drop only their own random databases.
The helper's GitHub Actions path was not run locally.

- [First full-suite attempt](vitest-before-test-db-setup.log): setup failures
  because the base 55433 test database had no schema; 110 tests passed and 108
  were skipped. This is not the diagnostic RED result.
- [Test database setup](test-db-setup.log): actual `db:migrate:test` applied all
  three migrations to `loungcheu_test` on 55433 before retrying regression.
- [First regression retry](vitest-regression.log): 208 tests passed, but the
  Windows worker running `events.test.ts` exited unexpectedly (3221226505).
  Vitest reported one unhandled error; this run is not accepted as a full pass.
- [Final regression retry](vitest-regression-retry.log): rerun with
  `npm.cmd test -- --reporter=dot --maxWorkers=1`; **21 files, 218 tests passed,
  exit 0**, with no reported unhandled errors.

[Read-only cleanup verification](cleanup.log) confirms **0 remaining disposable
databases** after the final run.

The [prior RED-step typecheck](../f06-migration-restart/typecheck.log) passed;
this GREEN changes SQL only, with no TypeScript changes.

## Remaining scope

Full F-06 browser lifecycle/UI edge coverage, completion/traceability/System SDS
updates, CI/review/release work remain. TEST-44(c) remains the separately agreed
integration PR after both feature PRs reach staging. This step does not close
Issue #47 or mark the feature Done. The assistant ran no Git commands.
