# F-06 — initial migration/API GREEN (Issue #47)

Executed 24 November 2026, approximately 01:56–02:02 Asia/Bangkok.
This is the GREEN step for the initial nine HTTP lifecycle cases, not completion of F-06 or Issue #47.

## Version chain

| Stage | Version | Evidence |
|---|---|---|
| Sprint 2 baseline before new tests | `cf0cac948292c36d81cac827b2b77307c8cf10ad` | SHA supplied by the user |
| Separate RED commit | `33ac9576a980ee72621ab7c472b628774f4f2dc3` | User committed nine failing cases and [RED evidence](../f06-red/README.md) |
| Initial API GREEN | Working tree after the RED commit; GREEN SHA to be recorded by the user after committing | [Same nine tests, now passing](registration-lifecycle-green.log) |

No Git command was run by the assistant. The lifecycle test file from the RED commit was not changed for this GREEN step.

## Environment

The original test database on Docker port 5432 contains legacy records, including a CANCELLED row without a cancellation timestamp. The new migration intentionally rejects such legacy state rather than inventing history. No lifecycle migration or data reconciliation was applied there.

The user chose to preserve that data and run this GREEN step on the existing Compose `db-test` container, host port **55433**, database **loungcheu_test**. The test URL override was set only in each command process. `.env.test` and the application database were not changed. This is a fresh/disposable test target with all three migrations applied.

The RED and GREEN runs therefore use separate test databases with the same database name but different host ports. The nine tests create isolated fixtures with the same controlled clock and HTTP/session setup in both runs. This environment difference is recorded explicitly; it is not a deployment or restart verification.

## Implementation in this step

- Add `cancelled_at`, RegistrationAction/RegistrationHistory and an atomic SQL migration/backfill using `gen_random_uuid()`; fail before changing schema if legacy CANCELLED data needs reconciliation.
- Cancel a participant-owned ACTIVE registration under Event → Registration locks; set cancelled_at and append history in the same transaction.
- Extend the existing registration endpoint: create = 201; reactivate = 200 with the same reference and registered_at, cancelled_at=null and one REACTIVATED history entry. Internal response-status metadata is omitted from JSON.
- Append the F-06 close route/service blocks at the end of the existing events files, leaving the existing blocks in place for the parallel F-07 work.
- Add cancelled_at to own list/detail responses; the roster schema remains unchanged.
- Ensure demo registrations created after migration receive REGISTERED history in their seed transaction.
- Update existing regression fixtures/cleanup for history FKs and expected own/registration schemas for cancelled_at. Existing access, duplicate, time and concurrency assertions remain.

## Commands and results

Run from the repository root, with TEST_DATABASE_URL pointed at the approved disposable Docker target on 55433. Credentials are intentionally omitted here; use the local Compose configuration.

```powershell
npm.cmd run db:generate
npm.cmd run db:migrate:test
npm.cmd run typecheck
npm.cmd test -- server/tests/integration/registration-lifecycle.test.ts --reporter=verbose
npm.cmd test -- --reporter=dot
```

| Check | Actual result | Evidence |
|---|---|---|
| Prisma generation | PASS | Command output observed |
| Migrate fresh test target | Three migrations applied, including `202611240001_registration_lifecycle` | Command output observed |
| Typecheck (server, client, tools) | PASS, exit 0 | Command output observed |
| Original lifecycle RED slice | 9 PASS, 0 FAIL/SKIP, exit 0 | [Lifecycle GREEN log](registration-lifecycle-green.log) |
| First full Vitest run | 176 PASS, 1 FAIL; the own-read unit test expected the old schema without cancelled_at | [Preserved first run](vitest-regression-first-run.log) |
| Full Vitest after updating that expected schema | 17 files, 177 PASS, 0 FAIL/SKIP, exit 0 | [Regression log](vitest-regression.log) |

## Still required

- Complete the remaining TEST-40/41 input/error/permission matrix, TEST-42 deterministic lock races, and TEST-44 migration/backfill/seed/rollback-specific verification. A fresh migration succeeding does not prove populated backfill or legacy guard behaviour.
- TEST-43 UI: cancel/re-register/close controls, unified registration-time label, lookup/error/session behaviour and browser E2E.
- NFR-03: actual OS-process restart persistence test; reload, re-login and createApp recreation alone are insufficient.
- TEST-44(c) stays in a separate integration PR after both #47 and #48 merge. F-07 TEST-47 switches from its CLOSED fixture to the actual close endpoint once integration is possible.
- Update implementation status/traceability/System SDS and completion records when those steps are verified, then teammate review, staging integration, reviewed release/deploy and post-deploy checks.

No application deployment, PR creation, Kanban update or Issue closure was performed in this step. Keep the Lab 6 UAT release unchanged and retain the #44 triage deadline of 25 November 2026, 20:00 Asia/Bangkok.
