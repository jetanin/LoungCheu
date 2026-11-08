# User-supplied repository review

Imported 8 November 2026 (Asia/Bangkok). This report describes reviewed commit eeafc313220fa9feda633b89cab8c4b90cb86f9e; its original and temporary diagnostic runs are reviewer-supplied evidence, separate from the new runs in this directory.

Reviewed branch: `feature/registration-views`, commit `eeafc313220fa9feda633b89cab8c4b90cb86f9e`.
Environment: Windows, Node 22.16.0, npm 11.11.0, Asia/Bangkok. Reviewer: Codex (AI assistance).

Scope: F-04/F-05, FR-07/08, AC-18–23 and relevant cross-feature acceptance, using repository SRS, SDS, contracts, STS and Product DoD. GitHub Issue/PR contents and current review/board status could not be retrieved; this is a repository review, not verification of live GitHub acceptance requirements or teammate approval.

## Verdict

The feature implementation matches the repository's F-04/F-05 contracts in the inspected code and executed checks. Do not mark the issue fully accepted yet: the committed browser tests fail during account switching, current documentation/evidence is inconsistent, and cross-feature process/reproduction/review gates remain incomplete.

## Findings

### RV-01 — P2: account-switch setup breaks both new browser tests

Locations: `tests/e2e/registration-views.spec.ts:11`, `:66`, `:93`.

The login helper navigates to `/login` without ending an existing server session. In the real journey, participant A is still logged in when the helper tries to log in as participant B. In the UI-state test, the mocked 401 clears client identity but leaves the real participant C session valid before attempting organizer B. On navigation, App reads the valid session and redirects to `/events`; the helper waits for a username input that will never appear. Both original tests time out. In the first case the context cleanup error obscures the failing body operation.

Actual original run: **0 passed / 2 failed**. The real journey reached registration readback/re-login and populated roster before timing out at account switching. A temporary copy of the suite explicitly ended any existing server session before navigating to Login; **2 passed**, including foreign-registration denial and wrong-role direct access. The diagnostic helper tolerated 401 when an existing UI logout completed concurrently; its first attempt expected only 204 and produced 1 pass / 1 fail. These diagnostic results do not make the committed suite green.

Required correction: explicitly logout and wait for completion before switching accounts, or use separate authenticated contexts. For the mocked-expiry case, invalidate the server session too or use the already-rendered Login form without a navigation that restores the old session. Rerun the committed focused suite, then the full browser regression suite.

### RV-02 — P2: current documentation identifies a committed change as uncommitted

Locations: `README.md:3`, `docs/traceability.md:3` and AC-18–23 rows, `docs/registration/views-verification.md:3`, `docs/registration/views-pr.md:27`, `docs/changelog.md:57`.

These current summaries still say the feature is uncommitted or that the commit command has not run. Git identifies the implementation as commit `eeafc31`. Update tested revision and branch status, distinguish historical attempts from this review, and record the actual browser setup failures above. Retain historical network-denial results with their dates; they do not explain the current failures. PR/push/merge/reviewer status must be filled from verified GitHub evidence, not inferred from local Git or this report.

### RV-03 — P2: delivery evidence and traceability still omit implemented coverage

Locations: `docs/deliverable-1/evidence-register.md:28`, `:30`, `:38`, `:42`, `:90`; `docs/traceability.md:44`, `:45`, `:59`, `:65`, `:102`; `docs/sprints/plan.md:7`.

The delivery register still describes own reads/roster and TEST-23/27 as pending, lists 145 as its latest Vitest count, and has no Issue #4 execution update. Traceability's BR-06/07 and NFR-01/06 rows and final summary retain pending F-04/F-05 wording despite implemented/passing coverage elsewhere in the same document. A blanket historical note above current status tables does not give a reviewer a consistent current result.

Update current evidence/requirement rows to reference the actual source revision and results. Keep full browser acceptance pending until RV-01 is corrected. Retain unfinished review, restart, reproduction and release gates rather than changing every pending field to PASS. Product DoD DOD-08 and AC-27 require consistent documentation/results/revisions.

## Executed checks

| Check | Actual result at reviewed source revision |
|---|---|
| `npm test` | 15 files, 159 passed, 0 failed/skipped; includes real PostgreSQL API and concurrency checks |
| `npm run typecheck` | PASS, server/client/tools |
| `npm run build` | PASS, client/server |
| `npm run test:built` | PASS, 3 compiled application smoke checks |
| `npx playwright test tests/e2e/registration-views.spec.ts` | FAIL, 2 timeouts; API/web ports 3027/5197 |
| Temporary browser copy with corrected account-switch setup | PASS, 2 tests; diagnostic only, removed after review |

The initial sandbox browser launch failed before tests at `uv_os_get_passwd`/ENOMEM; the approved run outside the sandbox reached feature assertions and exposed RV-01. No full browser regression rerun was performed after the focused committed suite failed.

## Requirement assessment

| Requirement | Evidence and assessment |
|---|---|
| AC-18 | Own list/detail schemas, timestamps, ordering and persisted reload/re-login readback verified by API/DB and diagnostic browser journey |
| AC-19 | Session-scoped queries; own/foreign/missing references; anonymous 401 and Organizer 403; API/DB PASS, diagnostic browser foreign reference denial PASS |
| AC-20 | Loading/empty/error/retry, account remount/late-response clearing verified by component tests and diagnostic browser UI-state case |
| AC-21 | Owner-scoped roster, empty DRAFT, order and ACTIVE-only count verified by API/DB and component tests |
| AC-22 | Other Organizer 404, Participant 403, anonymous 401 and minimal error bodies verified by API/DB |
| AC-23 | New registration changes roster/count consistently with DB; minimal participant fields; API/DB, component and diagnostic browser PASS |
| AC-24 | Real create/publish/register/own read/re-login/roster diagnostic journey PASS; committed E2E acceptance blocked by RV-01 |
| AC-25 | App recreation coverage exists; real OS-process restart and independent clean setup/reproduction remain unverified |
| AC-27 / Product DoD | Documentation findings above; live teammate review/integration/release evidence remains unverified |

Code review confirmed server-side auth/role/ownership checks, contract-only selects/serialization, a REPEATABLE READ roster snapshot, Bangkok presentation, and no new migration or Sprint 2/3 controls. Inspected generated mobile own-detail and desktop roster screenshots; this is not an independent device/browser acceptance matrix.

This review adds only this report. Temporary diagnostic test files were removed; product source and committed tests retain the reviewed implementation. Independent teammate approval and release acceptance are still required by the team's documented workflow.