# F-06 — initial UI GREEN (TEST-43)

Executed 24 November 2026, approximately 02:16–02:22 Asia/Bangkok.
This step implements the first TEST-43 component slice and checks selected existing browser journeys. It does not complete Issue #47.

## Version chain

| Stage | SHA / state |
|---|---|
| Sprint 2 baseline | `cf0cac948292c36d81cac827b2b77307c8cf10ad` |
| API RED | `33ac9576a980ee72621ab7c472b628774f4f2dc3` |
| Initial API GREEN | `0321258975fba373a92d847ea756f9caf397477f` |
| UI RED | `3f21204a936714f8ae33f9b01e344db1e926dcf7` |
| Initial UI GREEN | Working tree; the user records SHA after a separate commit |

All recorded SHAs were supplied by the user. No Git command was run by the assistant. The new RegistrationLifecycle.test.tsx from the UI RED commit was not changed during this GREEN step.

## Implementation

- Own detail: confirm cancellation, bootstrap CSRF, submit an empty-body POST, block duplicate clicks, display CANCELLED/cancelled_at and read back the current record. Own list/detail and roster use **ลงทะเบียนครั้งแรกเมื่อ** for the original registered_at.
- Event registration action: read the existing GET `/api/my/registrations`, select by `record.event.id`, distinguish ACTIVE/CANCELLED/no record, block mutation while the lookup is pending or failed, and use the existing POST for re-registration. Clear lookup state by remounting on account/role/event changes and ignore superseded/aborted reads.
- CANCELLED/full and CANCELLED/closed states explain why re-registration is unavailable. The containing event page retains its refresh-seats control.
- Owner detail: append a separate F-06 close control in the existing action row, with confirmation that closing is irreversible and does not cancel existing registrations. It is visible only for PUBLISHED. The existing publish flow and action order were retained; the F-07 edit control must precede close when the branches are integrated.
- Shared lifecycle action component: confirmation, current-session CSRF, busy guard, request timeout, explicit status check after an uncertain result, and scoped access/error handling. It does not retry a mutation automatically or enable an uncertain retry after a failed status check.
- Registration response validation now expects cancelled_at=null for a successful ACTIVE create/reactivate response.

Existing RegistrationAction/RegistrationPage test mocks were extended to supply the new own-list GET and wait for the action to be enabled. Their mutation-count, payload, timeout, session and refresh assertions remain. No assertion in the committed UI RED test was changed.

## Actual verification

| Check | Result | Evidence |
|---|---|---|
| Committed UI RED slice | 11 PASS, 0 FAIL/SKIP | [UI GREEN log](registration-lifecycle-ui-green.log) |
| Registration component tests | 4 files, 37 PASS, 0 FAIL/SKIP | [UI regression](ui-regression.log) |
| Typecheck (server, client, tools) | PASS, exit 0 | [Typecheck](typecheck.log) |
| Production build (client and server) | PASS, exit 0 | [Build](build.log) |
| Complete Vitest suite | 18 files, 188 PASS, 0 FAIL/SKIP | [Full regression](vitest-regression.log) |
| Selected Chromium regression | 3 PASS, exit 0 | [Browser regression](browser-regression.log) |

Commands from the repository root:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test -- client/src/features/registrations/RegistrationLifecycle.test.tsx --reporter=verbose
npm.cmd test -- client/src/features/registrations --reporter=dot
npm.cmd test -- --reporter=dot
npm.cmd run test:e2e -- tests/e2e/events-registration.spec.ts tests/e2e/registration-views.spec.ts
```

Component-only checks do not use a database. Full Vitest and browser checks use the user-approved disposable Docker test target on **55433**, database `loungcheu_test`, via a process-only TEST_DATABASE_URL override. Chromium starts API/Vite on **3011/5183**. Credentials are omitted here; `.env.test`, the existing test data on 5432 and the application deployment were not changed. The full Vitest and browser runs were sequential because they share fixtures.

## Selected visual inspection

The retained images come from the existing real publish/register/own-detail/roster browser journey. Both were visually inspected: the mobile detail shows the complete reference, the new first-registration label and cancellation control; the desktop roster shows the same label without clipped columns.

- [Own detail at 390px](own-detail-mobile.png)
- [Desktop roster](roster-desktop.png)

These screenshots and the three existing browser tests verify the original journeys after the UI changes. The cancellation/reactivation/close actions themselves are verified by the eleven component checks in this step, not yet by a real F-06 browser journey.

## Remaining before F-06 completion

- Add full TEST-43 browser lifecycle journeys and cancellation/close error, timeout and late-response coverage; these are not proven by passing the existing browser regression.
- Finish TEST-40/41 matrices, TEST-42 deterministic lock races, TEST-44 migration/backfill/seed/rollback-specific tests, and an actual OS-process restart persistence test for NFR-03.
- Keep TEST-44(c) in the separate integration PR after #47/#48 merge. F-07 TEST-47 adopts the real close endpoint after integration.
- Update implementation/completion/traceability documentation, obtain teammate review and CI, and follow the reviewed staging/main release process. No PR, merge, deployment, Kanban update or Issue closure was performed here.
