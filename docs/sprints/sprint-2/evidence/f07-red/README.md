# F-07 TDD RED → GREEN re-run (Issue #48)

Re-run 25 November 2026 (Asia/Bangkok) to retain the failing output that was
not saved when the RED commits were made (CI ran only on `ac28a9d` and
`9eb9afb`). Each commit was checked out unchanged in a separate Git worktree;
no test or application file was edited for this run.

| Step | Commit | Command | Result | Log |
|---|---|---|---|---|
| API RED | `ef94a3f` test(events): add failing F-07 edit event tests | `npx vitest run server/tests/integration/event-edit.test.ts server/tests/unit/event-patch.test.ts --reporter=verbose` | 2 files failed; **11 failed** / 0 passed / 0 skipped | [red-api.log](red-api.log) |
| API GREEN | `78efae7` feat(events): implement F-07 edit event API | same | 2 files passed; **11 passed** / 0 failed / 0 skipped | [green-api.log](green-api.log) |
| UI RED | `1fd71db` test(events): add failing F-07 edit event UI tests | `npx vitest run client/src/features/events/EventEdit.test.tsx --reporter=verbose` | 1 file failed; **7 failed / 1 passed** / 0 skipped | [red-ui.log](red-ui.log) |
| UI GREEN | `086f149` feat(events): add F-07 edit event UI | same | 1 file passed; **8 passed** / 0 failed / 0 skipped | [green-ui.log](green-ui.log) |

## Why the RED is meaningful

Every RED failure is an `AssertionError` on behaviour, not a missing module or
setup error:

- API: `PATCH /api/organizer/events/{id}` returned `404` where TEST-45/46/49
  expect `200`; TEST-47 expected `409 EVENT_NOT_EDITABLE`; TEST-48 expected
  `400` for an invalid body; TEST-50 found that the PATCH never waited on the
  Event lock; TEST-51 got the wrong error for the access matrix. The
  `eventPatch` unit tests (TEST-48 unit) got an empty result / no rejection.
- UI: no แก้ไขกิจกรรม link on DRAFT/PUBLISHED and no edit form heading.

The one UI test that passes at RED is "owner detail shows แก้ไขกิจกรรม only
for DRAFT/PUBLISHED (CLOSED)". It asserts that the link is **absent** on a
CLOSED event, which is already true before the feature exists. It is a guard
against a later regression, not evidence of the implementation.

Test counts here are lower than the CI runs (event-edit 7→8, EventEdit 8→10)
because TEST-44(c) and two review-fix UI tests were added later in `7c79d95`
and PR #60.

## Environment and limits

Windows 11, Node 22.23.5, Vitest 5.1.0; fresh `npm ci` in the worktree and
`prisma generate` from each commit's schema. The API runs used the local test
database `loungcheu_test` from `.env.test` (value not recorded). That database
already had the later F-06 migration `202611240001_registration_lifecycle`
(nullable `cancelled_at` and a new `registration_history` table); the F-07
commits predate it and do not read those objects. The worktree path is shown
as `<worktree>` in the logs. Local re-run, not CI.
