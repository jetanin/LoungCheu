# F-08 migration and demo seed — TEST-65 GREEN (#50)

Local verification on 27 November 2026 (Asia/Bangkok). This is the storage/seed
part of F-08, before the check-in endpoint and UI implementation.

## Source and scope

| Item | Value |
|---|---|
| Branch | `feature/50-f08-migration` |
| Baseline before RED | `a5bf4bac0c17ede5cb2e4c4d1bac243fc473b74c` |
| RED commit supplied by Jetanin Naitho | `ba4cb6e0ff369e5a573fe97240214832f24b534d` |
| GREEN commit | `61d1a05812e78e09a70f2ff8b1644046b4b7749e` ([PR #78](https://github.com/jetanin/LoungCheu/pull/78); [CI run 45873633625](https://github.com/jetanin/LoungCheu/actions/runs/45873633625) SUCCESS) |
| Test design | [STS v0.2, TEST-65](../../sts.md); NFR-05 / F-08 DoD 4 |
| Migration | `202611270001_registration_attendance` |
| Node / database | Node 22.23.2; PostgreSQL Docker at `127.0.0.1:55433`; test DB only |
| Meaningful RED | [8 intended assertion failures](../f08-migration-red/README.md) before implementation |
| Focused GREEN | **8 passed / 0 failed / 0 skipped**, exit 0 — [attendance-migration-green.log](attendance-migration-green.log) |
| Schema / generation | [validate PASS](schema-validate.log), [generate PASS](generate.log) |
| Full typecheck | [PASS](typecheck.log) |
| Full Vitest regression | **26 files / 273 passed**, exit 0 — [vitest-regression.log](vitest-regression.log) |
| Production build | [PASS](build.log) |
| Compiled production smoke | **4 passed**, exit 0 — [built-smoke.log](built-smoke.log) |
| Chromium regression | **39 passed / 0 failed / 0 skipped**, exit 0 — [chromium-regression.log](chromium-regression.log) |

The TEST-65 source was not edited during GREEN implementation. Its SHA-256 is
`9ea23ce528d3bf51a3373b86eb42cc9b0b0bb4293bc62cfb46371c6d2699a7d2`.
The same eight tests now reach the CHECK/FK, preservation and idempotence
assertions that were blocked by the missing columns/demo at RED.

## Changes

- `schema.prisma`: nullable `checkedInAt` mapped to `checked_in_at`
  (`timestamptz(3)`), nullable UUID `checkedInById` mapped to
  `checked_in_by_id`, with a named optional User relation and Restrict delete.
  The original participant relation is explicitly named to distinguish it.
- SQL migration: adds both columns, the pair-nullability CHECK, ACTIVE-only
  CHECK, and User FK (ON DELETE RESTRICT / ON UPDATE CASCADE) in one transaction.
  Existing rows start with both values null; no lifecycle history is added or
  rewritten by this migration.
- Demo seed: adds event `de202600-0000-4000-8000-000000000007` with ACTIVE 2,
  checked-in 1. Close/start is Bangkok midnight on the first seed day; end is
  seven days later. The original six scenarios retain their IDs and behaviour.
  New registrations each get one REGISTERED history; check-in does not add a
  separate history action. Existing Events are skipped under the existing
  advisory transaction lock, preserving later changes/check-ins.
- Existing seed regression expectations account for seven Events/six
  Registrations/six REGISTERED histories. Original scenario, browsing,
  timestamp, ownership, FK, rollback and idempotence assertions remain.
- README and System SDS describe the storage addition without claiming the
  F-08 service/API/UI or AC-41–46 are complete.

## What TEST-65 proves

1. Apply the real S1/S2 migrations to a fresh disposable DB, create ACTIVE and
   CANCELLED records with millisecond timestamps/history, then apply the real
   current migration chain. Preserve users, Events, old Registration fields,
   references and history; initialize new fields to null; repeat deploy safely.
2. Run the actual seed entry point on a fresh migrated DB. Verify the demo's
   Bangkok dates, two ACTIVE rows, one valid checked-in pair and one REGISTERED
   history per record. Preserve an edited check-in when seeding again and when
   two seed processes run concurrently; also verify fresh concurrent seeding.
3. Reject both INSERT and UPDATE for timestamp-only, actor-only, CANCELLED
   attendance and nonexistent actors. Preserve all data after rejected writes.
4. Accept the valid pair and both-null state; retain millisecond precision;
   prevent deleting a checker who has no other references, proving the new FK.

## Commands and environment

The following run on Node 22 with process-only DATABASE_URL/TEST_DATABASE_URL
overrides for the approved Docker test instance (credentials omitted):

```text
node node_modules/prisma/build/index.js validate --config server/prisma.config.ts
node node_modules/prisma/build/index.js generate --config server/prisma.config.ts
npm run typecheck
node node_modules/vitest/vitest.mjs run server/tests/integration/attendance-migration.test.ts --reporter=verbose
node node_modules/prisma/build/index.js migrate deploy --config server/prisma.config.ts
node node_modules/vitest/vitest.mjs run
npm run build
node scripts/smoke-built.mjs
node node_modules/@playwright/test/cli.js test
```

Browser ports are 3011/5183, selected through E2E_API_PORT/E2E_WEB_PORT. All CLI
seed/migration children receive the disposable URL for that case. The helper
guards its target and drops only its owned random DBs. The full regression target
is the approved `loungcheu_test` on 55433; `.env.test` is unchanged and the
original 5432 database is not accessed. The first regression preflight found
this test DB had no registrations table; it was initialized by the actual
migration CLI. [Migration audit](migration-audit.json) records the constraints
and initial test DB state. S2 data preservation is proven by TEST-65(a), not
inferred from an empty regression database.

## Remaining acceptance

Local tests are not teammate acceptance or a deployed release. CI/review/merge
into `sprint-3-staging` remain pending. F-09 can use the schema after that merge
and regeneration. AC-43 meaningful rule RED/GREEN, other F-08 AC, serializers/UI,
TEST-66 restart, independent reproduction and release remain subsequent work.
