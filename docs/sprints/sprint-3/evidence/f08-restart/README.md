# F-08 TEST-66 / NFR-03 — compiled backend process restart

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- Baseline supplied by the student: `609e2d0e779271970e1669eebc85281ec71cf5d9`.
- Source tested: baseline plus uncommitted `server/tests/integration/attendance-restart.test.ts`; retain the subsequent verification commit SHA for D2.
- Executed: 27 November 2026, 02:13 Asia/Bangkok; exact UTC start times and commands retained in logs.
- Runtime: Node v22.23.2; Docker PostgreSQL `127.0.0.1:55433`. A randomly named disposable database is created/migrated by the existing guarded lifecycle test helper, reused across both backend processes, then dropped without FORCE. The preserved port-5432 database was not used.

## Method and actual observations

The test applies the real migration chain to its own database and builds the backend with `tsc -p server/tsconfig.build.json`. It starts the actual `server/dist/server.js` entrypoint on an available loopback port, with real HTTP/session cookies/CSRF and no test endpoint, clock shim or in-process createApp recreation. `/api/ready` must report the expected version and connected DB before proceeding.

The synthetic ECHECK3-style fixture has capacity 5, PA/PB ACTIVE and PC CANCELLED, with three REGISTERED history rows plus PC's CANCELLED row. Its schedule brackets the real server clock near t0+3h, rather than using an expired fixed date: t0 is set to wall-clock time minus three hours. The successful check-in timestamp must fall between the real request's start/end times.

Observed sequence:

1. First compiled process PID **42336** becomes ready. OA and PA log in; own attendance starts null and roster checked-in count is 0.
2. OA checks in PA. API/DB timestamp is `2026-11-26T19:13:28.566Z`; DB actor is OA. Only PA's two attendance fields change. Every Event field, the other registrations and lifecycle history remain equal to their prior snapshots.
3. Capture roster and PA's own detail/list. ACTIVE=2, checked-in=1, three registration rows and four history rows.
4. Stop PID 42336 and verify `/api/ready` is unreachable before starting another backend on the same port/database.
5. Second compiled process PID **38556** becomes ready with a different version marker. Both OA and PA log in using fresh cookie jars. Roster and own detail/list responses equal their pre-stop values; timestamp/actor and the complete DB snapshot remain unchanged.
6. Stop the final owned process, disconnect test clients and drop the owned disposable database. The runner independently confirms that the database no longer exists.

Actual PIDs, readiness/stopping events, timestamp, counts and cleanup result are retained in [restart-summary.json](restart-summary.json), derived from the `F08_RESTART` observations in the test log. The disposable name retains the existing helper's `loungcheu_test_f06_…` prefix; it is still a fresh database owned by this F-08 test.

## Results

| Verification | Actual result | Evidence |
| --- | --- | --- |
| Server typecheck including new test | PASS | [typecheck.log](typecheck.log) |
| TEST-66 / actual compiled backend restart | 1/1 PASS; two distinct PIDs and fresh account logins | [attendance-verification.log](attendance-verification.log) |
| Existing attendance API/unit/concurrency suites | 66/66 PASS | [attendance-verification.log](attendance-verification.log) |
| Combined attendance verification | 7 files, 67/67 PASS | [attendance-verification.log](attendance-verification.log) |
| Owned database cleanup | Confirmed removed | [restart-summary.json](restart-summary.json) |

The existing implementation passed this additional persistence test; no new RED or production change is claimed. [source-audit.json](source-audit.json) records the new test/compiled entrypoint/app SHA-256 values and confirms production source/Prisma files remained unchanged during verification. Compilation is part of TEST-66; full regression/client build/browser checks were not repeated for this test-only step. Earlier full-run evidence remains scoped to [its recorded source](../f08-own-green/README.md).

## Remaining gates

TEST-59 attendance UI/component/Chromium coverage remains. This local compiled-process test establishes API/storage persistence, not the planned attendance UI, deployed Cloud Run restart verification, full F-08 acceptance, GitHub CI, teammate review, staging merge or release verification.
