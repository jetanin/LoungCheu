# Published revision reconciliation — 10 November 2026

Source: feature/registration-views at **331328812092c04db84859c4ca00e9a6aa70b0fe**. Initial F-04/F-05 implementation was eeafc31; RV-01–03 were committed8November22:39:43 Asia/Bangkok as3313288. Remote and PR10 head were verified at3313288 on10November. The current documentation follow-up changes neither application nor test code.

## Execution evidence and immutable history

Before editing documents, all34 entries in ../review-fixes/manifest.json matched this3313288 checkout using raw or normalized-LF SHA256. historical-manifest-audit.json records that check. All11 source/test entries still match after documentation edits.

Original8November execution logs, screenshots, GitHub snapshot and manifest remain unchanged in ../review-fixes/. Their before-commit metadata (including patch_committed=false/patch_pushed=false and old head eeafc31) is historical, not current publication state. Do not validate those historical documentation hashes against a later edited README; they identify the documents committed in3313288. manifest.json in this directory records current document hashes, unchanged source hashes and links to that historical manifest.

Recorded source results:159 Vitest, focused2/full37 Chromium, typecheck/build PASS and compiled smoke3 PASS. The follow-up review supplied10November reports the same results at3313288. No new application test execution is claimed for this documentation-only pass.

## Documented commands

Run from repository root using its existing test script (vitest run):

~~~powershell
npm test -- server/tests/integration/registration.test.ts
npm test -- server/tests/unit
npm test -- server/tests/integration
~~~

No test:registration or server-workspace test/test:db aliases exist in this revision. README now uses file filters instead of inventing those scripts. Vitest list with the same filters was executed successfully on10November; the three *-collection.log files record discovered definitions. Discovery is not a test pass count; parameterized cases may be collapsed in listing.

## GitHub capture and remaining gates

github-status.json records read-only git ls-remote and gh pr view10 results: source3313288 published, PR10 OPEN/Draft into sprint-1-staging, reviews=[], no review decision or merge. The dated8November snapshot is retained separately. This pass does not claim project-board completion, Issue acceptance, OS-process restart, independent clean reproduction/UAT, teammate approval, staging integration/merge or main release acceptance.

No GitHub mutation, commit or push was performed in this documentation reconciliation. Current source hashes remain stable across later documentation-only commits.
