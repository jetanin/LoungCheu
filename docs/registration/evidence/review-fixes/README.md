# Review-fix evidence — 8 November 2026

Implementation: eeafc313220fa9feda633b89cab8c4b90cb86f9e, feature/registration-views. The tested RV-01–03 working-tree patch is not committed/pushed. manifest.json records raw file SHA256 and normalized-LF hashes to identify the tested source across Windows checkouts.

Windows / Node22.23.2 / npm11.11.0 / PostgreSQL17.11. Tests used the existing ephemeral Docker container loungcheu-db-test-1 on localhost55433, not the app database. Docker Desktop was started and the container's existing test profile was used. Existing migrations were applied; no schema/source migration was added.

## Reproduction

From the repository root with supported Node22 on PATH and Docker ready:

~~~powershell
docker start loungcheu-db-test-1
$env:TEST_DATABASE_URL = 'postgresql://loungcheu:test_only@127.0.0.1:55433/loungcheu_test?schema=public'
$env:E2E_WEB_PORT = '5197'
$env:E2E_API_PORT = '3027'
npm run db:migrate:test
npm run test:e2e -- tests/e2e/registration-views.spec.ts
npm test
npm run typecheck
npm run build
npm run test:built
npm run test:e2e
~~~

The password above is the public synthetic test fixture from compose.yaml, not a user credential. Environment overrides are process-local; .env.test was not edited. Run Vitest and browser tests sequentially because both seed test accounts/sessions.

## Actual current results

- focused.log: corrected source suite2 PASS.
- vitest.log:15 files/159 PASS,0 FAIL/SKIP.
- typecheck.log/build.log:PASS.
- built-smoke.log:3 PASS.
- e2e.log:full37 PASS,0 FAIL/SKIP.
- own-detail.png/roster.png:current full browser journey, inspected after capture.
- github-status.json:read-only PR10 OPEN/Draft to sprint-1-staging, head eeafc31/no reviews/no merge; PR9 CLOSED; Issue4 OPEN, captured8Nov.
- review-eeafc31.md:user-supplied review of the original committed suite (2 failures); temporary diagnostic passes in that report are not current source-suite results.

Prior7Nov network-denial attempts and8Nov initial localhost5432 connection refusal remain documented in ../../views-verification.md. The latter ran no feature assertions. Browser account-switch failure was a separate test setup bug, corrected by RV-01.

No teammate approval, independent clean reproduction/UAT, OS-process restart, staging merge or release acceptance is inferred from these results. This pass read GitHub state but did not post comments, alter PRs, commit or push.
