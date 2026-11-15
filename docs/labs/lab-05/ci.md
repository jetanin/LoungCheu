# Issue #16: pull request CI

The workflow in this branch is [`.github/workflows/ci-docker.yml`](../../../.github/workflows/ci-docker.yml). Its `test-and-docker` job is configured to run automatically for pull requests into `lab5-staging` and `main`; `workflow_call` also makes the same checks reusable by the later release workflow. It has read-only repository permissions and does not access GCP or production credentials. This work has not yet been verified by a GitHub Actions run.

The job uses Node 22 and a disposable PostgreSQL 17 service configured with the application test database `loungcheu_test`. `TEST_DATABASE_URL` is supplied by CI, not copied from a developer's `.env.test`. The steps run in order: root `npm ci`, Prisma Client generation, test DB migrations, typecheck, all Vitest unit and integration tests, production client/server build, compiled-app smoke, Chromium E2E tests, and the root production Docker build. Database suites run sequentially against the same disposable database.

The TokTickIT starter workflow installs and tests the server and client separately. LoungCheu uses one root workspace lockfile, so CI installs once at the root. The Guide copies `deploy/` in Episode 4 because its example workflow checks those scripts; its literal Done list also expects that folder on `main`. This adapted workflow does not reference deployment scripts, and Issue #16 covers the handout's R-05/C-01 PR build and test requirement. The team schedules LoungCheu-specific deployment scripts and offline tests in Issues #17 and #19 rather than copying the TokTickIT scripts unchanged. This is a documented difference from the Guide's Episode 4 file sequence; add offline checks to CI when those scripts exist, before using them for a release.

`test:local-db` is a developer smoke against a seeded application database and requires private demo credentials, so it is not run against the disposable CI test database. The CI job instead runs the full Vitest suite, the compiled-app DB smoke and the browser journeys.

## Local pre-PR verification (15 November 2026)

An isolated, disposable PostgreSQL 17 container was used with `TEST_DATABASE_URL` pointing to `loungcheu_test`. No existing application database was used. `npm run db:generate`, `npm run db:migrate:test`, `npm run typecheck` and `npm run build` passed. `npm test` passed 168 tests in 16 files; `npm run test:built` passed its four checks; `npm run test:e2e` passed 37 Chromium tests; and the production `docker build` succeeded. `actionlint` validated the workflow. The temporary database container was stopped and removed after verification. These are local checks of the working tree, not a GitHub Actions C-01 result.

## Review evidence to retain

- PR into `lab5-staging` with an automatically started, passing `CI & Docker Build / test-and-docker` run, including the run URL, source SHA and test summary.
- Release PR from `lab5-staging` into `main` with the same passing check before merge.
- Teammate review stating a specific check and `lab5` labels on the Issue and PR.

The required-check ruleset and intentionally failing temporary PR are Episode 6 / C-02, not part of Issue #16. Do not mark C-01 complete until the real GitHub Actions run passes on the pull requests above.

The [R-10 label/history audit](evidence/r10-label-history.md) verifies the existing Lab 5 labels and lists the CI history that must be retained after the workflow runs.
