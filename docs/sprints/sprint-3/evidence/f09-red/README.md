# F-09 TDD evidence — step 1 (rate + access), Issue #74

Contract: [Sprint 3 contracts](../../contracts.md) F-09 AC-48, AC-50 | STS: [TEST-61 unit, TEST-63](../../sts.md) | Branch `feature/74-sprint-3-f09-summary`

| Step | Commit | Command | Result | Log |
|---|---|---|---|---|
| RED | `60cbc8e` (tests only, on top of contract commit `2bfdb9a`) | `npx vitest run server/tests/unit/attendance-rate.test.ts server/tests/integration/attendance-summary.test.ts` | 2 files failed: `rate.js` module missing; TEST-63 got `404 ROUTE_NOT_FOUND` instead of `401 AUTH_REQUIRED` | [red-api.log](red-api.log) |
| GREEN | `062ed8d` | same command | 2 files, 8/8 passed (TEST-61 unit 7 cases, TEST-63) | [green-api.log](../f09-green/green-api.log) |
| Typecheck | `062ed8d` | `npm run typecheck` | exit 0 | [typecheck.log](../f09-green/typecheck.log) |
| Regression (local) | `062ed8d` | `npx vitest run` | 27 files: 264 passed, 9 failed (environment, see below) | [vitest-regression.log](../f09-green/vitest-regression.log) |

The 9 local failures are TEST-44(a/b) in `registration-lifecycle-migration.test.ts` and TEST-43 in `registration-lifecycle-restart.test.ts`. All 9 fail with the same error: `Lifecycle disposable databases require Docker:55433 or the ephemeral GitHub Actions PostgreSQL service`. This machine has no Docker PostgreSQL on port 55433, so these tests cannot run here. They do not touch F-09 code. CI `test-and-docker` provides that service and must pass all of them before merge. No test was skipped or weakened.

## Scope of this step and what is still open

- Done: `attendanceRate` (half-up, integer math, DEC-18). `GET /api/organizer/events/{id}/summary` with auth → role → path input → owner scope (404) order. A REPEATABLE READ snapshot query counts ACTIVE, CANCELLED and checked-in registrations.
- **Not yet verified:**
  - TEST-60, TEST-61 (API part) and TEST-62 need the `checked_in_at` column. That column comes from the F-08 migration (#50), and the summary query already reads it.
  - Until that migration is merged, the owner success path cannot run, so AC-47–AC-49 are **not** claimed.
  - TEST-64 (UI) has not started.
