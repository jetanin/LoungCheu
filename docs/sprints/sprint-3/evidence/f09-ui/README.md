# F-09 TDD evidence — step 2 (summary page UI), Issue #74

Contract: [Sprint 3 contracts](../../contracts.md) F-09 Workflow / UI, AC-50 | STS: [TEST-64](../../sts.md) (component part) | Branch `feature/74-sprint-3-f09-summary`

| Step | Commit | Command | Result | Log |
|---|---|---|---|---|
| RED | `172be7d` (tests + empty stub component, on top of `a43b03e`) | `npx vitest run client/src/features/attendance/AttendanceSummary.test.tsx` | 1 file, 8/8 failed on assertions (stub renders nothing) | [red-ui.log](red-ui.log) |
| GREEN | `b685766` | same command | 1 file, 8/8 passed | [green-ui.log](green-ui.log) |
| Typecheck | `b685766` | `npm run typecheck` | exit 0 | [typecheck.log](typecheck.log) |
| Regression (local) | `b685766` | `npx vitest run` | 28 files: 272 passed, 9 failed (environment, see below) | [vitest-regression.log](vitest-regression.log) |

The 9 local failures are the same TEST-44(a/b) and TEST-43 cases as in [step 1](../f09-red/README.md): `Lifecycle disposable databases require Docker:55433 or the ephemeral GitHub Actions PostgreSQL service`. They do not touch F-09 code. CI `test-and-docker` runs them.

## What the 8 component cases check (mocked API)

| Case | UI rule from the contract |
|---|---|
| Loading → values | Placeholder while loading, no 0 shown early; 4 values ACTIVE/CANCELLED/เช็กชื่อแล้ว/อัตราเข้าร่วม `{rate}%`; line "เช็กชื่อแล้ว x จาก ACTIVE y คน"; "ข้อมูล ณ" in Asia/Bangkok; link back to event detail; request path `/api/organizer/events/{id}/summary` |
| ACTIVE=0 (DRAFT) | 0.00% with "ยังไม่มีผู้ลงทะเบียน ACTIVE"; every number still shown |
| รีเฟรชสรุป | Button reads again and replaces values; window focus does **not** auto-refresh |
| Error | Network failure shows an alert with ลองใหม่, then recovers |
| 401 | Calls the login redirect, no values shown |
| 403 / 404 | On refresh, shown values are cleared and the API message is shown |
| Participant | Role message, no request sent |

## Wiring in the same GREEN commit

- `App.tsx`: route `/organizer/events/{id}/summary`, kept on identity re-check.
- `EventPage.tsx`: owner-only link **ดูสรุปผล** next to ดูรายชื่อผู้ลงทะเบียน.
- `app.css`: `.summary-grid` (4 columns, 2 on narrow screens).

## Not yet verified

- TEST-64 E2E (Chromium): the flow needs a real check-in, and the summary query needs the `checked_in_at` column from the F-08 migration (#50). Until then the page would get a server error from the real API, so this branch must not merge before that migration.
- The owner link and route are covered by the existing E2E suite only through CI (no new E2E yet).
- TEST-60, TEST-61 (API), TEST-62: same dependency as step 1.
