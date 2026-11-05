# Server/client layout and local PostgreSQL configuration

6 November 2026; requested after the F-01 pre-PR review. Contracts/AC v0.5 are unchanged. The user confirmed keeping the renamed `server/` and `client/` directories and updating active references.

Latest instance configuration: both app and test databases now use localhost:5432; cluster 55432 has been stopped. [Single-instance migration/verification](single-instance-db.md) supersedes the earlier test-instance setup described in historical sections below.

## Current layout

- npm workspaces/package names: `server` / `@loungcheu/server`, `client` / `@loungcheu/client`.
- Root scripts, Vitest/Playwright, tools TypeScript config, helper imports, source capture, lockfile links and ignore rules use the new paths.
- Production Express serves `client/dist`; server runtime/Prisma/seed read private `server/.env`.
- `.env.test` remains the separate test configuration. Templates are `server/.env.example` for the application and root `.env.test.example` for tests. The redundant root `.env.example` was removed at the user's request; a root runtime `.env` was absent.
- Active documentation paths have been updated. Older logs, test/source snapshots and SHA256 manifests under auth evidence retain their historical paths and results.

## Application database — migrated and verified

Target: `loung-cheu-database` on the user's PostgreSQL 17.6 service at `localhost:5432`. The initial URL used port 5439, which returned no response, and the next URL lacked role authentication. These initial connection failures are historical; the user subsequently corrected private `server/.env`, and a read-only connection check succeeded against an empty database.

Read-only inspection of the installed PostgreSQL 17 configuration showed `scram-sha-256` for local/IPv4/IPv6 connections and port 5432. A connection attempt without a password was rejected with the client classification `server_requested_password`. Credentials were not printed, and server authentication settings were not modified.

After the user requested migration/testing, `npm run db:migrate` successfully applied `202611060001_auth` to the application DB. Confirmed tables: `_prisma_migrations`, `sessions`, `users`; migration is finished and not rolled back. `npm run db:seed` created 3 active Participants, 2 active Organizers and 1 inactive synthetic account. A random demo password is stored only as `DEMO_SEED_PASSWORD` in ignored `server/.env`; neither the password nor the connection credentials are printed in evidence.

`npm run test:local-db` exercises the compiled Express app with this actual application database: connection/health, anonymous `/me` rejection and both-role Login/Identity/Logout, including session rotation and old-cookie rejection. It does not reset/delete application user data. This is separate from the unit/API/E2E test database.

| Application DB check | Actual result | Evidence |
|---|---|---|
| `npm.cmd run db:migrate` | PASS, applied `202611060001_auth` to `loung-cheu-database` | [migrate.log](../../deliverable-1/evidence/auth/local-db-migrated/migrate.log) |
| `npm.cmd run db:seed` | PASS, six synthetic accounts with private local demo password | [seed.log](../../deliverable-1/evidence/auth/local-db-migrated/seed.log) |
| `npm.cmd run test:local-db` | PASS: real app-DB health and both-role auth lifecycle | [local-db-smoke.log](../../deliverable-1/evidence/auth/local-db-migrated/local-db-smoke.log) |
| Read-only schema/migration/user summary | PASS: three tables, completed migration, expected synthetic role/active counts | [database-state.json](../../deliverable-1/evidence/auth/local-db-migrated/database-state.json) |

At the time of the application-DB migration tests below, the automated database was `loungcheu_test` on the project cluster `127.0.0.1:55432`. This is historical: the user subsequently requested a single 5432 instance, and the test target was moved, migrated and retested as recorded in the linked single-instance record.

The separate test **database** is required by the accepted STS and fixture-reset behavior. The subsequent single-instance switch created `loungcheu_test` on the same PostgreSQL service as the app and updated private `.env.test`; app data and archived legacy cluster data were preserved.

## Executed verification after rename

Source: uncommitted `feature/auth`, parent `53959423ca34e08d9b9869d4ea200b961e60f5bb`; executor Codex (AI assistance), not teammate approval.

| Check | Actual result | Evidence |
|---|---|---|
| Workspace install/link refresh, offline | PASS; renamed workspace packages linked and obsolete extraneous workspace metadata removed; no dependency version change | package.json / package-lock.json and tool execution |
| `npm.cmd run db:generate` | PASS, Prisma Client 7.10.1 generated from `server/prisma.config.ts` | [generate.log](../../deliverable-1/evidence/auth/server-client/generate.log) |
| `npm.cmd test` | **54 PASS**, 0 fail/skip, real separate test PostgreSQL | [tests.log](../../deliverable-1/evidence/auth/server-client/tests.log) |
| `npm.cmd run typecheck` | PASS, server/client/tools/config/E2E | [typecheck.log](../../deliverable-1/evidence/auth/server-client/typecheck.log) |
| `npm.cmd run build` | PASS, client/server | [build.log](../../deliverable-1/evidence/auth/server-client/build.log) |
| `npm.cmd run test:built` | **3 smoke checks PASS** against test DB, including serving renamed client build | [built-smoke.log](../../deliverable-1/evidence/auth/server-client/built-smoke.log) |
| `npm.cmd run test:e2e` | **7 PASS**, 0 fail/skip, browser/test DB | [e2e.log](../../deliverable-1/evidence/auth/server-client/e2e.log) |

[Rename-phase source manifest](../../deliverable-1/evidence/auth/server-client/sha256.txt) identifies that historical source version. Latest source and rerun results after application migration/root-template removal are in [current manifest](../../deliverable-1/evidence/auth/local-db-migrated/sha256.txt), [unit/API](../../deliverable-1/evidence/auth/local-db-migrated/tests.log), [typecheck](../../deliverable-1/evidence/auth/local-db-migrated/typecheck.log), [build](../../deliverable-1/evidence/auth/local-db-migrated/build.log), [compiled smoke](../../deliverable-1/evidence/auth/local-db-migrated/built-smoke.log) and [browser E2E](../../deliverable-1/evidence/auth/local-db-migrated/e2e.log). Earlier manifests are historical and must not be rewritten. Feature commit/push/PR, teammate review, full event/registration journey and main release remain pending.
