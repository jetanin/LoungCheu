# F-09 evidence — step 4 (integration with F-08 check-in), Issue #74

Contract: [Sprint 3 contracts](../../contracts.md) F-09 AC-49, AC-50 | STS: [TEST-62, TEST-64](../../sts.md) | Branch `feature/74-sprint-3-f09-summary`

## What changed

In [step 3](../f09-api/README.md), TEST-62 and the TEST-64 E2E stored the check-in directly in the DB, because the F-08 check-in endpoint and UI were not in staging yet. F-08 check-in (PR #79) is now merged into `sprint-3-staging` as `03a5927`.

| Step | Value |
|---|---|
| Branch update | `git merge origin/sprint-3-staging` → merge commit `d58390e` (no rebase). One conflict in `server/src/app.ts`: both sides added an attendance router. Kept both: F-08 check-in router first, then the F-09 summary router. The routes do not overlap (POST check-in vs GET summary) |
| Prisma | PR #79 has no schema or migration change, so no new generate/migrate was needed. `loungcheu_test` already has `202611270001_registration_attendance` from step 3 |
| TEST-62 | ECHECK3: the owner (OA) now checks in PA through `POST /api/organizer/events/{id}/registrations/{registrationId}/check-in` with CSRF at t0+3h (inside starts t0+2h … ends t0+4h). The response must have `checked_in_at` = controlled clock. The next summary read gives 0 → 1 and "0.00" → "50.00" as before |
| TEST-64 E2E | The event is now in progress on the real server clock (registration closed 2 h ago, started 1 h ago, ends in 1 h) instead of year 2099. The owner opens the roster in a second tab, clicks **เช็กชื่อ** on Participant B and accepts the confirmation. The DB row then has the owner as checker. The open summary page still shows 1 until **รีเฟรชสรุป**, then 2 and 100.00% |

## Results (local, 27 November 2026)

| Test | Command | Result | Log |
|---|---|---|---|
| TEST-60/61/62/63 | `npx vitest run server/tests/integration/attendance-summary.test.ts server/tests/unit/attendance-rate.test.ts` | 2 files, 12/12 passed | [api-tests.log](api-tests.log) |
| TEST-64 E2E (Chromium) | `npx playwright test tests/e2e/attendance-summary.spec.ts` | 1 passed | [e2e-summary.log](e2e-summary.log) |
| Playwright regression | `npx playwright test` | 41 passed (40 before + F-08 TEST-59) | [playwright-regression.log](playwright-regression.log) |
| Typecheck | `npm run typecheck` | exit 0 | [typecheck.log](typecheck.log) |
| Vitest regression | `npx vitest run` | 37 files: 363 passed, 18 failed (environment, see below) | [vitest-regression.log](vitest-regression.log) |

All 18 local Vitest failures are `Lifecycle disposable databases require Docker:55433 or the ephemeral GitHub Actions PostgreSQL service`: TEST-43/44 (9), F-08 TEST-65 (8) and F-08 TEST-66 `attendance-restart.test.ts` (1). This machine has no Docker PostgreSQL on port 55433. CI `test-and-docker` runs them.

## Limits

- These tests were already passing with the DB-written check-in. Changing the check-in step to the real API/UI is not a new RED/GREEN; it removes the stand-in from step 3.
- The ESUM3 and ERATE3 fixtures still set one `checked_in_at` in setup, as the STS fixture table describes (initial state, not the action under test).
- Local runs only; CI on the pushed head and teammate review are still to come.
