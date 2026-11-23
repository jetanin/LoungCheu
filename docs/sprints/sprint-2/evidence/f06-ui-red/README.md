# F-06 — initial UI RED (TEST-43)

Executed 24 November 2026, approximately 02:08–02:10 Asia/Bangkok.

## Version chain

| Stage | SHA |
|---|---|
| Sprint 2 baseline | `cf0cac948292c36d81cac827b2b77307c8cf10ad` |
| Initial API RED | `33ac9576a980ee72621ab7c472b628774f4f2dc3` |
| Initial API GREEN / source before UI changes | `0321258975fba373a92d847ea756f9caf397477f` |
| UI RED | New test/evidence files in the working tree; user records SHA after a separate commit |

These SHAs were supplied by the user, who runs all Git commands. No Git command or production UI change was performed by the assistant in this step.

## Scope and environment

This is a component-level slice of planned TEST-43 / AC-28–30,32 using the existing MyRegistrations, OrganizerRoster, RegistrationAction and EventPage components. Vitest/jsdom mocks fetch at the HTTP boundary; it does not use a database or browser E2E runner. Date is fixed at `2026-11-06T03:00:00.000Z` so cancellation is before the fixture deadline. Real polling/mutation timers remain available.

The tests cover:

- Consistent **ลงทะเบียนครั้งแรกเมื่อ** labels and the original registered_at value on own pages and roster.
- Cancel confirmation, canceling the dialog, duplicate-click protection, same-session CSRF/empty-body mutation and the resulting CANCELLED state.
- Cancellation timestamp and original reference on own detail.
- Existing GET own-list lookup filtered by event.id, followed by re-registration through the existing registration endpoint.
- CANCELLED/full-event explanation and blocking registration when the own-list lookup fails.
- Owner close confirmation and CLOSED result; no close control for DRAFT/CLOSED.

## Commands and actual results

```powershell
npm.cmd test -- client/src/features/registrations/RegistrationLifecycle.test.tsx --reporter=verbose
npm.cmd test -- client/src/features/registrations/RegistrationViews.test.tsx client/src/features/registrations/RegistrationAction.test.tsx client/src/features/registrations/RegistrationPage.test.tsx --reporter=dot
npm.cmd run typecheck
```

| Check | Actual result | Evidence |
|---|---|---|
| Initial TEST-43 component slice | 9 FAIL, 2 PASS, 0 SKIP; exit 1 | [UI RED log](registration-lifecycle-ui-red.log) |
| Existing registration UI baseline | 3 files, 26 PASS, 0 FAIL/SKIP; exit 0 | [Baseline log](ui-baseline.log) |
| Typecheck (server, client, tools) | PASS; exit 0 | [Typecheck log](typecheck.log) |

The failures are missing visible controls, labels, cancellation time and lookup/error UI. All existing component imports resolve. The two passing checks confirm that DRAFT/CLOSED currently have no close button. Assertions after each first failure are planned checks, not yet passing evidence.

An intermediate excess-property TypeScript error in the new test fixture was corrected before this retained run; it is not counted as RED.

## Next step

The user commits this UI RED slice separately and records its SHA. Then implement UI GREEN while retaining the same assertions. Keep the F-06 close button after the F-07 edit button in the owner action row when both are present; do not refactor the shared page for this change.

This evidence does not complete TEST-43 browser E2E, session/late-response/error/timeout coverage, TEST-42 lock races, TEST-44 migration/seed/rollback checks or the NFR-03 OS-process restart test. TEST-44(c) remains a separate integration PR after both feature PRs merge.
