# F-08 migration — TEST-65 RED evidence (#50)

Recorded 27 November 2026 (Asia/Bangkok), before changing the F-08 schema,
migration or seed. This is a Codex-assisted local automated run, not teammate
review, CI, independent reproduction or UAT.

| Item | Value |
|---|---|
| Branch | `feature/50-f08-migration` |
| Baseline SHA supplied by Jetanin Naitho | `a5bf4bac0c17ede5cb2e4c4d1bac243fc473b74c` |
| Source tested | Baseline plus the new, not-yet-committed `attendance-migration.test.ts` |
| RED commit | Pending: Jetanin commits the test and this evidence before GREEN implementation |
| Design | [Sprint 3 STS v0.2, TEST-65](../../sts.md), NFR-05 and F-08 DoD 4 |
| Node | 22.23.2 |
| Database | Existing approved PostgreSQL Docker test container, host `127.0.0.1:55433`; administrative DB `loungcheu_test`; random disposable child DBs per case |
| Server typecheck | PASS, exit 0 — [typecheck.log](typecheck.log) |
| TEST-65 | Expected RED, exit 1: **8 failed / 0 passed / 0 skipped** — [attendance-migration-red.log](attendance-migration-red.log) |
| Execution time | Vitest started 27 Nov 2026 00:54:36 Asia/Bangkok; duration 41.86 seconds. Log header records command start in UTC |

## Commands

Use the installed Node 22 runtime. `TEST_DATABASE_URL` was overridden only for
the process, pointing at the approved 55433 test instance. Credentials are not
included here and `.env.test` was not edited.

```text
node node_modules/typescript/bin/tsc --noEmit -p server/tsconfig.json
node node_modules/vitest/vitest.mjs run server/tests/integration/attendance-migration.test.ts --reporter=verbose
```

## Intended RED and test design

| Case | What the test will verify at GREEN | Actual RED |
|---|---|---|
| TEST-65(a) | Real S2 migrations on a new DB → synthetic ACTIVE/CANCELLED records and history → real current migrations; retain all old data, add nullable timestamptz(3)/UUID columns, and repeat migrate without changes | AssertionError: attendance column metadata is `[]` instead of the two required columns |
| TEST-65(b), sequential seed | Actual seed entry point creates the attendance demo with ACTIVE 2 / checked-in 1 and REGISTERED history; repeat and concurrent seed preserve an edited check-in and all records | AssertionError: no demo matching the required attendance scenario |
| TEST-65(b), fresh concurrent seed | Two actual seed processes on a fresh migrated DB create one scenario and no duplicate registrations/history | AssertionError: no demo matching the required attendance scenario |
| TEST-65(c), timestamp only | CHECK rejects INSERT/UPDATE with timestamp but no actor, retaining data | AssertionError: attendance columns are absent |
| TEST-65(c), actor only | CHECK rejects INSERT/UPDATE with actor but no timestamp, retaining data | AssertionError: attendance columns are absent |
| TEST-65(c), CANCELLED | CHECK rejects attendance on CANCELLED for INSERT/UPDATE | AssertionError: attendance columns are absent |
| TEST-65(c), actor FK | FK rejects a nonexistent checked-in actor for INSERT/UPDATE | AssertionError: attendance columns are absent |
| TEST-65(c), positive pair / FK restriction | Valid pair and both-null state work, millisecond timestamp persists, a referenced checker cannot be deleted; Event/history remain unchanged | AssertionError: attendance columns are absent |

The column assertions deliberately precede SQL using the new fields. This
produces a meaningful schema-contract failure rather than an undefined-column
setup exception. CHECK/FK and preservation assertions following that guard are
written but have **not yet executed successfully**; they must pass at GREEN.
The tests never create substitute attendance columns/constraints themselves.

## Isolation and limits

- The S2 baseline CLI receives temporary copies of the three actual S1/S2
  migrations. The upgrade CLI uses the repository's actual migration directory.
- The existing `withLifecycleDatabase` helper allows only the approved local
  55433 instance or CI's ephemeral PostgreSQL service. It owns random DB names,
  verifies the administrative DB and drops its own DBs without FORCE.
- The runner found zero helper-owned disposable DBs remaining after the run.
  Temporary migration-directory cleanup checks the resolved workspace path.
- `server/prisma/schema.prisma` and `server/prisma/demo-data.ts` hashes stayed
  unchanged during the run. No F-08 migration or application implementation
  was added; the original database on 5432 was not accessed.
- TEST-66 process restart and AC-43 check-in behaviour are later work. No GREEN,
  migration PR, deployment, board update or Issue completion is claimed here.

## Next step

Commit this test and evidence as RED and record the actual commit SHA. Only
then add the schema, SQL migration and attendance demo seed, rerun TEST-65,
and run the affected Sprint 1–2 regression suite. Existing seed expectations
will need to account for the additional demo while preserving their original
scenario assertions; passing this focused suite alone is not full regression.
