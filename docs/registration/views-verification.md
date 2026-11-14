# Issue #4 — current verification and review corrections

Reconciled 14 November 2026 (Asia/Bangkok). The recorded 8 November application/test execution is bound to **331328812092c04db84859c4ca00e9a6aa70b0fe** (initial implementation eeafc313220fa9feda633b89cab8c4b90cb86f9e). The later reviewed PR #10 head is **0bd3468f31a9637feab5b9a9d102c22d5eede3d1** and staging merge is **97a5b9173ec6b0a53a7759f683b440ec49eae396**. Do not relabel the older execution as a new run on either later commit. The [10 November revision manifest](evidence/revision-3313288/manifest.json) is historical; the [review/merge reconciliation](../deliverable-1/evidence/review-merge-20261112/README.md) supplies later workflow evidence.

## Verified GitHub state

The retained 12 November Part F snapshots show PR #7 and PR #10 approved by teammate i3artuf and merged into sprint-1-staging. PR #10 approval: 10 November 16:25:38 Asia/Bangkok at0bd3468; merge:16:26:11 at97a5b91. See [JSON snapshots and review details](../deliverable-1/evidence/review-merge-20261112/README.md). Earlier [10 November](evidence/revision-3313288/github-status.json) and [8 November](evidence/review-fixes/github-status.json) captures remain historical, not current pending-review claims. No live GitHub query was made in this reconciliation; final board/main release/independent acceptance are not established.

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
| AC-27 / TEST-34 | PARTIAL: baseline docs/results and PR #7/#10 substantive teammate approvals/staging merges evidenced; final board, reviewed main release and full process acceptance remain pending |

Recorded8November full-journey screenshots: [mobile own detail](evidence/review-fixes/own-detail.png) and [desktop roster](evidence/review-fixes/roster.png), visually inspected after capture. Reproduction commands: [evidence README](evidence/review-fixes/README.md).

## Retained historical attempts

- **7 November:** initial import-only RED was not meaningful domain TDD. Future2098 API fixture timestamps were corrected to past dates/controlled clock. Full159/typecheck/build passed on Node22/24; Node24 smoke3 passed, Node22 smoke had localhost EACCES. Initial browser network-denial/React-loading failures remain historical, not an explanation for the later account-switch bug.
- **User-supplied review of eeafc31**, imported8 November: committed focused suite **0 PASS/2 FAIL** at account-switch setup, after real readback/re-login/populated roster. Temporary corrected helper produced2 PASS; first diagnostic accepting only204 had1 PASS/1 FAIL. Those diagnostics were removed by the reviewer and did not make the committed suite green. That review also records Vitest159/typecheck/build/smoke3 PASS. [Original report](evidence/review-fixes/review-eeafc31.md).
- **8 November correction pass:** initial pre-correction execution could not start because localhost5432 refused DB connections; no assertions ran. Isolated test DB55433 was prepared; corrected source suite then passed2/2. The setup failure is not a meaningful domain RED.

## Remaining acceptance gates

This documentation reconciliation changes no product logic, schema, AC or test code and claims no new application execution. Feature teammate approval and staging merges are evidenced. OS-process restart, independent clean reproduction/UAT, final board/main release acceptance and applicable deployment gates still require separate evidence. GAP-02 remains OPEN; DOD-05 and overall Product DoD remain incomplete; DOD-07 is PARTIAL pending reviewed release acceptance.
