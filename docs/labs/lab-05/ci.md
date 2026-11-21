# Issue #16: pull request CI

The workflow in this branch is [`.github/workflows/ci-docker.yml`](../../../.github/workflows/ci-docker.yml). Its `test-and-docker` job runs automatically for pull requests into `lab5-staging` and `main`; `workflow_call` also makes the same checks reusable by the later release workflow. It has read-only repository permissions and does not access GCP or production credentials. The corrected workflow has a passing GitHub Actions run on PR #23 into `lab5-staging`.

The job uses Node 22 and a disposable PostgreSQL 17 service configured with the application test database `loungcheu_test`. CI supplies both `TEST_DATABASE_URL` for the test suites and `DATABASE_URL` for Prisma config loading during `prisma generate`; both point to the same disposable database and are not copied from a developer's `.env.test`. The steps run in order: root `npm ci`, Prisma Client generation, test DB migrations, typecheck, all Vitest unit and integration tests, production client/server build, compiled-app smoke, Chromium E2E tests, and the root production Docker build. Database suites run sequentially against the same disposable database.

The TokTickIT starter workflow installs and tests the server and client separately. LoungCheu uses one root workspace lockfile, so CI installs once at the root. The Guide copies `deploy/` in Episode 4 because its example workflow checks those scripts; its literal Done list also expects that folder on `main`. Issue #16 covered the handout's R-05/C-01 PR build and test requirement. The follow-up in Issue #17 now adds LoungCheu-specific `deploy/` scripts and runs their standard-library Python tests immediately after checkout, without GCP access. The course-portal adaptation prepares deploy.sh/release.sh and a parked deploy.yml draft, with Python mock tests and Bash syntax checks. In #17 deploy.yml has no push trigger and both jobs are disabled until a separately reviewed #19 change; first deployment is manual. Real WIF, required-check and release/rollback proof remain #18/#19; the shared-course changes passed matching-head CI on PR #24, and release PR #25 also passed and merged; see the verified records below.

`test:local-db` is a developer smoke against a seeded application database and requires private demo credentials, so it is not run against the disposable CI test database. The CI job instead runs the full Vitest suite, the compiled-app DB smoke and the browser journeys.

## Local pre-PR verification (15 November 2026)

An isolated, disposable PostgreSQL 17 container was used with `TEST_DATABASE_URL` pointing to `loungcheu_test`. No existing application database was used. `npm run db:generate`, `npm run db:migrate:test`, `npm run typecheck` and `npm run build` passed. `npm test` passed 168 tests in 16 files; `npm run test:built` passed its four checks; `npm run test:e2e` passed 37 Chromium tests; and the production `docker build` succeeded. `actionlint` validated the workflow. The temporary database container was stopped and removed after verification. These are local checks of the working tree, not a GitHub Actions C-01 result.

## Review evidence to retain

- [PR #23](https://github.com/jetanin/LoungCheu/pull/23) into `lab5-staging` with the automatically started, passing [CI & Docker Build / test-and-docker run 43741684848](https://github.com/jetanin/LoungCheu/actions/runs/43741684848) on source SHA `774d28f68da8fc32bd96805f38c3b6ba437fc6ba`.
- Release PR from `lab5-staging` into `main` with the same passing check before merge.
- Teammate review stating a specific check before merging PR #23. Issue #16 and PR #23 already have the `lab5` label.

The required-check ruleset and intentionally failing temporary PR are Episode 6 / C-02, not part of Issue #16. The staging PR has passing C-01 CI; release PR #25 into `main` subsequently passed as recorded below. This does not establish the separate C-02 merge gate or C-06 automatic deployment proof.

Historical snapshot on 16 November 2026 (Asia/Bangkok): PR #23 was open and has no submitted review, and Issue #16 is open. After these documentation changes are committed and pushed, verify that CI passes again on the new PR head before merging. The [R-10 label/history audit](evidence/r10-label-history.md) records the verified labels and both CI runs.

## First GitHub run and correction

[PR #23](https://github.com/jetanin/LoungCheu/pull/23) started [CI run 43740436556](https://github.com/jetanin/LoungCheu/actions/runs/43740436556) on head `efd71f2822bf4872a93de8d3672d3ba82d2967e4`. It failed during `npm run db:generate` because `server/prisma.config.ts` requires `DATABASE_URL` when loading, even though the generation step does not connect to PostgreSQL. The workflow now supplies the disposable test URL under both variable names. The failed run remains part of the CI history and does not count as passing C-01 evidence.

The next [CI run 43741684848](https://github.com/jetanin/LoungCheu/actions/runs/43741684848) completed successfully on PR #23 head `774d28f68da8fc32bd96805f38c3b6ba437fc6ba`. GitHub reports the `test-and-docker` job and every substantive step as successful: dependency install and Prisma generation, test database migration, typecheck and unit/integration tests, app build and compiled-route smoke, Chromium browser tests, and production Docker image build. PR #23 and Issue #16 both have the `lab5` label as verified on 16 November 2026 (Asia/Bangkok).

## PR #24 and release PR #25: verified merge and CI

Verified with the GitHub API on 21 November 2026. Both PRs are merged, not awaiting CI/merge. Times below use Asia/Bangkok (+07).

| PR / target | Actual source head | CI result | Merge result |
| --- | --- | --- | --- |
| [#24 → lab5-staging](https://github.com/jetanin/LoungCheu/pull/24) | `03668672856c16fb8840debf276e487dc101d662` | [44728212429](https://github.com/jetanin/LoungCheu/actions/runs/44728212429): completed, success | 20 Nov 23:18:57; `5a6b3b5445c47fb56d2a97c1a007c314003a1070` |
| [#25 → main](https://github.com/jetanin/LoungCheu/pull/25) | `5a6b3b5445c47fb56d2a97c1a007c314003a1070` | [44787143909](https://github.com/jetanin/LoungCheu/actions/runs/44787143909): completed, success | 21 Nov 13:42:42; `87c77af07bfbb7f2b4e0d9ada4b69cd79a5c6b5f` |

The earlier [44722418056](https://github.com/jetanin/LoungCheu/actions/runs/44722418056) passed on `9f7bf525434e4ff43df6d757981a10c0d2ae9be1`; retain it as historical evidence, not the final PR #24 head result. Offline 28-test output and parked/skipped Deploy demo runs are not substitutes for PR CI.

The [automatic deployment run 44882261079](https://github.com/jetanin/LoungCheu/actions/runs/44882261079) on `49aa64543a3c5a3f6f4f46b37a6e6a59b65e05a4` failed; it is separate from both successful CI runs and the operator's subsequent manual deployment. See [live #17 evidence](evidence/issue17-live-20261121/README.md). Issue #17 is open pending complete C-04 capture, not pending the merge of #24/#25. Any new documentation PR still needs its own matching-head CI before merge.
