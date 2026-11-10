# Issue #4 — current verification and review corrections

Updated 10 November 2026 (Asia/Bangkok). Branch feature/registration-views; implementation eeafc313220fa9feda633b89cab8c4b90cb86f9e and RV-01–03 fixes are **committed and pushed as 331328812092c04db84859c4ca00e9a6aa70b0fe**. Remote and PR #10 head were verified at3313288 on10Nov. [Current revision/documentation manifest](evidence/revision-3313288/manifest.json) binds this source to its execution evidence. Later documentation-only reconciliation does not change the tested application/test code.

## Verified GitHub state

Read-only checks on10November: [PR #10](https://github.com/jetanin/LoungCheu/pull/10) OPEN/Draft into sprint-1-staging, head3313288, reviews=[], no review decision/merge. [Current captured fields](evidence/revision-3313288/github-status.json). The separate [8November snapshot](evidence/review-fixes/github-status.json) is historical and identified head eeafc31 then. Board status, independent acceptance and release approval were not verified.

## RV-01 — account-switch setup

The original login helper navigated to /login while a real server session remained valid. App correctly restored that identity and redirected to /events, so the helper waited for a login field that never appeared. This affected Participant A → B and Participant C → Organizer B after a mocked401: the mock cleared client identity, not the real session.

The helper now reads identity, fetches CSRF, awaits logout when authenticated, accepts204 or a concurrent completed logout's401, and verifies /auth/me=401 before navigating to Login. Foreign-registration denial and wrong-role assertions remain. Product authorization logic is unchanged.

## Recorded execution — source content committed as3313288

The8November execution below tested the source later committed in3313288. Before this documentation update, all34 files in the [original manifest](evidence/review-fixes/manifest.json) matched the3313288 checkout (raw or normalized-LF SHA256). The original manifest and logs remain immutable historical evidence: its uncommitted/unpushed flags describe capture time before commit, not current publication state. New documentation hashes and source binding are in the current manifest linked above. This10November pass checks documentation, command discovery and remote metadata; it does not claim a new application test execution. The user-supplied follow-up review of3313288 also reports159 Vitest/37 Chromium/typecheck/build/smoke3 PASS.

Windows, Node22.23.2, PostgreSQL17.11, synthetic data. Docker loungcheu-db-test-1 at **127.0.0.1:55433/loungcheu_test**; API3027/web5197. TEST_DATABASE_URL is overridden only in test commands; .env.test and app database are unchanged. Existing auth/registration migrations were applied to this isolated tmpfs database. Docker Desktop and the existing test container were started because localhost5432 refused connections.

| Check | Recorded result / evidence |
|---|---|
| Focused source suite: npm run test:e2e -- tests/e2e/registration-views.spec.ts | **2 PASS**, 0 fail/skip; [focused.log](evidence/review-fixes/focused.log) |
| Full npm test | **159 PASS**, 15 files, 0 fail/skip; [vitest.log](evidence/review-fixes/vitest.log) |
| npm run typecheck | **PASS** server/client/tools; [typecheck.log](evidence/review-fixes/typecheck.log) |
| npm run build | **PASS** client/server; [build.log](evidence/review-fixes/build.log) |
| npm run test:built | **3 PASS** compiled application smoke; [built-smoke.log](evidence/review-fixes/built-smoke.log) |
| Full npm run test:e2e | **37 PASS**, 0 fail/skip, including both corrected Issue #4 cases; [e2e.log](evidence/review-fixes/e2e.log) |

## Requirements and implementation

F-04/F-05 implement FR-07/08, AC-18–23 without migrations, cancellation, check-in or reporting. Participant own list/detail returns session-scoped records and EventSummary; order registered_at DESC/id ASC. Roster scopes Event by owner before retrieval; order registered_at ASC/id ASC. Explicit selects/serialization return participant.display_name only. Rows/ACTIVE count share a REPEATABLE READ snapshot. Guards enforce auth → role → UUID → scope. Views show Bangkok time and loading/empty/error/retry, clear data across account/resource changes and ignore obsolete responses.

| AC / tests | Actual coverage |
|---|---|
| AC-18 / TEST-22,24 | registration-views.test.ts own schema/order/persistence/re-login/app recreation; focused browser own list/detail, reload/re-login and same reference |
| AC-19 / TEST-23 | API: ownership, missing/foreign404, anonymous401, Organizer403; focused browser Participant B cannot open Participant A reference |
| AC-20 / TEST-25 | RegistrationViews.test.tsx empty/error/retry/account remount/late reads; focused browser empty/error/retry, mocked401 then real Organizer wrong-role page |
| AC-21 / TEST-26,28 | API exact fields/order, ACTIVE/CANCELLED count, empty DRAFT; UI empty/refreshed roster |
| AC-22 / TEST-27 | API other Organizer404, Participant403, anonymous401; minimal error bodies |
| AC-23 / TEST-29 | API new reference/count equals DB; focused browser owner roster shows matching reference/display name |
| AC-24 / TEST-30 | Focused real UI create → publish → register → own read/re-login → owner roster **PASS**; synthetic accounts/isolated DB, not independent UAT |
| AC-25 / TEST-31,35 | App recreation subset; OS-process restart and independent clean reproduction **NOT VERIFIED** |
| AC-27 / TEST-34 | RV-02/03 align documents/evidence with committed source3313288 and current documentation. PR facts above verified; teammate review, integration/release and full process acceptance incomplete |

Recorded8November full-journey screenshots: [mobile own detail](evidence/review-fixes/own-detail.png) and [desktop roster](evidence/review-fixes/roster.png), visually inspected after capture. Reproduction commands: [evidence README](evidence/review-fixes/README.md).

## Retained historical attempts

- **7 November:** initial import-only RED was not meaningful domain TDD. Future2098 API fixture timestamps were corrected to past dates/controlled clock. Full159/typecheck/build passed on Node22/24; Node24 smoke3 passed, Node22 smoke had localhost EACCES. Initial browser network-denial/React-loading failures remain historical, not an explanation for the later account-switch bug.
- **User-supplied review of eeafc31**, imported8 November: committed focused suite **0 PASS/2 FAIL** at account-switch setup, after real readback/re-login/populated roster. Temporary corrected helper produced2 PASS; first diagnostic accepting only204 had1 PASS/1 FAIL. Those diagnostics were removed by the reviewer and did not make the committed suite green. That review also records Vitest159/typecheck/build/smoke3 PASS. [Original report](evidence/review-fixes/review-eeafc31.md).
- **8 November correction pass:** initial pre-correction execution could not start because localhost5432 refused DB connections; no assertions ran. Isolated test DB55433 was prepared; corrected source suite then passed2/2. The setup failure is not a meaningful domain RED.

## Remaining acceptance gates

No product logic, schema or AC change was introduced by these fixes. Keep teammate approval, staging integration/merge, OS-process restart, independent clean reproduction/UAT, main release and applicable deployment gates pending until separately evidenced. AI review and automated tests do not establish entire Sprint Product DoD.
