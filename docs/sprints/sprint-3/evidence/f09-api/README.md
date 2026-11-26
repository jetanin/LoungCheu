# F-09 evidence — step 3 (counts through the API, E2E), Issue #74

Contract: [Sprint 3 contracts](../../contracts.md) F-09 AC-47–AC-50 | STS: [TEST-60, TEST-61 (API), TEST-62, TEST-64 (E2E)](../../sts.md) | Branch `feature/74-sprint-3-f09-summary`

## Setup before this step

| Step | Value |
|---|---|
| F-08 migration on staging | PR #78 merged as `a8ff503` (migration `202611270001_registration_attendance`) |
| Branch update | `git merge origin/sprint-3-staging` → merge commit `df36eb3` (no rebase, no conflict) |
| Prisma | `npx prisma generate` in `server/` |
| Test DB | `npx prisma migrate deploy` on `loungcheu_test`: applied `202611270001_registration_attendance` (4 migrations found). This machine has no local dev `.env`, so only the test DB was migrated |

## Results

| Test | Commit | Command | Result | Log |
|---|---|---|---|---|
| TEST-60(a)(b), TEST-61 API, TEST-62 + TEST-61 unit + TEST-63 | `ba47cc8` | `npx vitest run server/tests/integration/attendance-summary.test.ts server/tests/unit/attendance-rate.test.ts` | 2 files, 12/12 passed | [api-tests.log](api-tests.log) |
| Mutation check (see below) | `ba47cc8` + temporary wrong query, reverted | `npx vitest run server/tests/integration/attendance-summary.test.ts` | 3 failed / 2 passed, as intended | [mutation-check.log](mutation-check.log) |
| TEST-64 E2E (Chromium) | this commit | `npx playwright test tests/e2e/attendance-summary.spec.ts` | 1 passed | [e2e-summary.log](e2e-summary.log) |
| Playwright regression | this commit | `npx playwright test` | 40 passed (39 existing + TEST-64) | [playwright-regression.log](playwright-regression.log) |
| Typecheck | this commit | `npm run typecheck` (server, client, tools incl. `tests/e2e`) | exit 0 | [typecheck.log](typecheck.log) |
| Vitest regression (local) | `ba47cc8` | `npx vitest run` | 29 files: 276 passed, 17 failed (environment, see below) | [vitest-regression.log](vitest-regression.log) |

The 17 local failures are all `Lifecycle disposable databases require Docker:55433 or the ephemeral GitHub Actions PostgreSQL service`: TEST-44(a/b) and TEST-43 (9, as in steps 1–2) and the new F-08 TEST-65 `attendance-migration.test.ts` (8). They need the Docker PostgreSQL instance on port 55433, which this machine does not have. CI `test-and-docker` runs them.

## No RED for TEST-60/61 API/62, so a mutation check instead

The summary query was written in step 1 (`062ed8d`) before the `checked_in_at` column existed. These tests could only run after the F-08 migration, and they passed on their first run. That is not TDD RED/GREEN, so it is stated here as such.

To show the tests can fail, the query was changed on purpose (ACTIVE counted as all rows; checked-in counted as `checked_in_at IS NOT NULL OR status = 'CANCELLED'`). TEST-60(a), TEST-60(b) and TEST-62 failed. TEST-61 API (ERATE3 has no CANCELLED rows) and TEST-63 still passed, which is expected for that change. The file was restored with `git checkout` and is unchanged in `ba47cc8`.

## Limits

- **Check-in step is written to the DB.** The F-08 check-in endpoint and UI do not exist yet. TEST-62 and the TEST-64 E2E "check in another participant" step update `checked_in_at` / `checked_in_by_id` directly (the same columns F-08 writes, owner as checker). Re-run both with the real check-in once F-08 lands.
- **"CANCELLED not counted as checked-in" (AC-47)** cannot be set up in data: the F-08 CHECK `registrations_checked_in_active_check` rejects a CANCELLED row with `checked_in_at`. The query also filters `status = 'ACTIVE'`.
- **Login refresh in tests.** Sessions last 2 h on the controlled clock. Tests that move the clock to t0+3h log in again first; without this the old session is expired and destroyed (first run got 401).
- Local runs only; CI and teammate review are still to come.
