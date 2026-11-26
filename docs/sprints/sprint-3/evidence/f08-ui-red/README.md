# F-08 TEST-59 — attendance UI RED

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- Baseline supplied by the student: `d61e1768b3a35c9e00ce61758ed5f4e768ea31aa`.
- Tested source: baseline plus uncommitted `client/src/features/registrations/AttendanceViews.test.tsx` and `tests/e2e/attendance.spec.ts`. Retain the subsequent RED commit SHA in D2; the baseline is not this new RED commit.
- Executed: 27 November 2026, 02:24–02:25 Asia/Bangkok; exact UTC start timestamps and commands retained in logs.
- Runtime: Node v22.23.2. API/DB tests and Chromium use Docker PostgreSQL `127.0.0.1:55433`, `loungcheu_test`; browser API/web ports are 3011/5183. Environment overrides are process-only. The preserved port-5432 database was not used.

## Actual results

| Check | Observed result | Evidence |
| --- | --- | --- |
| Workspace/server/client/tools typecheck | PASS | [typecheck.log](typecheck.log) |
| Existing registration views + TEST-53/MyRegistrationS3 + TEST-55 | 14/14 PASS across 3 files | [baseline.log](baseline.log) |
| New TEST-59 component suite | Expected RED: 19 failed, 2 passed / 21 | [component-red.log](component-red.log) |
| New TEST-59 real Chromium journey | Expected RED: 1 failed; owner roster loads but PA's row has no check-in button | [chromium-red.log](chromium-red.log) |

Component failures are missing attendance labels, column or action in existing public components, not missing imports or new prop types. The two passing cases verify that CANCELLED own list/detail omit attendance; this behavior already holds because the baseline renders no attendance section.

`component-red.log` is a condensed record of the original execution: command/time/exit code, all 21 case outcomes, representative assertion errors and final totals are retained; repeated DOM dumps and stack traces are omitted. It is not a rerun. The [full original log in the RED commit](https://github.com/jetanin/LoungCheu/blob/54deba90eb510cf0626066367464f2ecc1bfc6bb/docs/sprints/sprint-3/evidence/f08-ui-red/component-red.log) remains available, and the condensed header records its SHA-256.

The component definitions cover checked/unchecked own list/detail, CANCELLED suppression, roster counts and column, confirmation containing the participant name, cancel-without-POST, busy/single-send, time-window hints, cancelled/previously-checked rows, three Thai 409 messages with roster refresh, 401/403/404 privacy clearing, and explicit reconciliation after an uncertain POST abort. They use mocked API responses; the timeout case simulates a sent request rejecting with AbortError and does not claim an elapsed real timeout. Responses are copied to avoid shared-object mutation in mocks.

Assertions after the initial missing UI element have not run yet. In particular, these RED results do not establish that confirmation, busy, denial, reconciliation or browser re-login behavior currently works; those require GREEN.

## Browser evidence

The Chromium test creates a synthetic event currently in progress, with PA/PB ACTIVE and PC CANCELLED and their lifecycle history. Owner/participant logins and the existing roster API succeed on the real backend. The API reports checked-in count 0; the owner UI renders PA's row but has no check-in action, which is the failing assertion. No HTTP response or browser clock is mocked. The test cleans up only its synthetic event/registrations/history and closes the participant context.

The remaining browser steps specify dismissing then accepting a named confirmation, one real check-in POST, roster reload, participant own list/detail after logout/login, and unchanged Event/history/other registration fields. These steps are not reached in RED.

[attendance-browser-red.png](attendance-browser-red.png) is the owner-roster failure screenshot. It shows the existing four-column roster with no attendance column/action; no password or token is visible. Playwright produced two page screenshots, so the runner's single-image auto-copy did not apply (`screenshotCopied: false` in the source audit). The reviewed owner image was then copied byte-for-byte; [screenshot-evidence.json](screenshot-evidence.json) records original/copy SHA-256 values. The other page screenshot was not copied.

No production component, service, schema or migration was changed for this step. [source-audit.json](source-audit.json) records the new test hashes and unchanged production-source verification during the run. An initial test-authoring type error mixed Playwright's `exact` option into React Testing Library queries; it was corrected before the retained successful typecheck and meaningful RED runs.

## Next gate

Commit these two tests and this evidence as a separate RED commit before implementing attendance UI. Preserve the tests for GREEN, then run the new component/browser cases plus relevant existing regressions. TEST-59 remains incomplete until those results pass; this record is not a release or acceptance result.
