# F-06 × F-07 cross-feature — TEST-47 / TEST-52 / TEST-44(c) (Issue #47, #48)

Run 24 November 2026 (Asia/Bangkok), branch `test/47-sprint-2-cross-feature`
from `sprint-2-staging` `24ebf07` (F-06 #59 + F-07 #57 merged). The commit SHA
of this change is recorded in the PR. TEST-44(c) is an F-06 test ID; M1 agreed
that M2 writes it in this PR.

## What changed

Contract cross-feature table: close → PATCH = EVENT_NOT_EDITABLE (TEST-47 uses
an event closed by F-06 when ready) and cancel → capacity edit (TEST-44(c)).

| Test | Before | Now |
|---|---|---|
| TEST-47 / AC-36 (API/DB) | ECLOSED2 inserted as CLOSED by fixture | ECLOSED2 created PUBLISHED, closed via real `POST /api/organizer/events/{id}/close` (200, CLOSED, `active_count`=1, `registration_open`=false, `updated_at`=clock); the row after close is the "unchanged" baseline, then clock moves on before each PATCH (a)–(d) |
| TEST-52 / AC-40 (Chromium) | separate CLOSED event inserted with `pg` | owner presses ปิดรับกิจกรรม + confirms on the same PUBLISHED event that was just edited; after reload: CLOSED, no แก้ไขกิจกรรม link, edited title/location still shown, `/edit` shows กิจกรรมนี้ปิดแล้ว แก้ไขไม่ได้ with no save button |
| TEST-44(c) / AC-33 (API/DB) | not executed | EPUB2 (capacity 3, ACTIVE PA+PB): PA cancel 200 (ACTIVE 2→1) → OA PATCH capacity=1 200 (available 0) → PA reactivate 409 EVENT_FULL, record still CANCELLED with the same `cancelled_at`, history REGISTERED+CANCELLED only → OA PATCH capacity=2 200 → PA reactivate 200 same `id` and `registered_at`, `cancelled_at`=null, one record for PA, ACTIVE=2, history + REACTIVATED; other connection reads capacity 2 / available 0 |

Expected results, AC and TEST IDs are unchanged (STS v0.8). All three are
coverage additions that pass on the existing F-06/F-07 implementation — not a
new RED.

## Results

| Command | Result | Log |
|---|---|---|
| `npx vitest run server/tests/integration/event-edit.test.ts --reporter=verbose` | 8 passed / 0 failed (TEST-45–51 + TEST-44(c)) | [event-edit-vitest.log](event-edit-vitest.log) |
| `npx playwright test tests/e2e/event-edit.spec.ts` | 1 passed (TEST-52) | [test-52-chromium.log](test-52-chromium.log) |
| `npx playwright test tests/e2e/event-edit.spec.ts tests/e2e/registration-lifecycle.spec.ts` | 2 passed (TEST-52 + F-06 TEST-43 close journey) | — |
| `npm run typecheck` | pass | — |
| `npx vitest run` (full, with TEST-44(c)) | 25 files; 255 passed / 9 failed / 0 skipped (264) | — |
| `npx playwright test` (full, Chromium) | 39 passed | — |

The 9 failures are `registration-lifecycle-migration.test.ts` (8, TEST-44(a/b))
and `registration-lifecycle-restart.test.ts` (1, NFR-03). Each stops with
"Lifecycle disposable databases require Docker:55433 or the ephemeral GitHub
Actions PostgreSQL service": this run used the local 5432 test DB, not Docker.
They are not affected by this change and are expected to run in CI.

Environment: Windows 11, Node 22.16.0, Vitest 5.1.0, Playwright 1.64.1,
PostgreSQL test DB from `.env.test` (value not recorded). Local runs are not CI,
review or an accepted release.
