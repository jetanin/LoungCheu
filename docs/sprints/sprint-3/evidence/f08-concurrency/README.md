# F-08 TEST-58 / AC-46 — concurrency and clock-after-lock verification

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- Baseline supplied by the student: `ac2002a8088cd2c2dcd225f3a02fcd26cba86bcd`.
- Source tested: baseline plus uncommitted `server/tests/integration/attendance-concurrency.test.ts`; retain the subsequent verification commit SHA for D2.
- Executed: 27 November 2026, 02:08–02:09 Asia/Bangkok; exact UTC start times and commands retained in logs.
- Runtime: Node v22.23.2; PostgreSQL on Docker `127.0.0.1:55433`, database `loungcheu_test`, using process-only environment overrides. The preserved port-5432 database was not used.

## Method and actual observations

Two separate Express runtimes use independent Prisma writers/connections, real owner session/CSRF login, and different injected clocks: A uses T1=`2026-11-06T06:00:00.000Z`; B uses T2=`2026-11-06T06:05:00.000Z`. A separate PostgreSQL connection holds the Event row lock. Polling `pg_stat_activity`/`pg_blocking_pids` verifies that each runtime has actually reached the Event lock wait before releasing the barrier. Distinct application names and backend PIDs identify the writers; no guessed delay decides when a request is waiting.

TEST-58(a) runs 20 independent fresh-event cases, alternating which runtime joins the real lock queue first. In every case:

- Both requests are observed waiting before the barrier is released; writer PIDs differ.
- Exactly one response is 200 and the other is 409 `ALREADY_CHECKED_IN`; A wins 10 cases and B wins 10.
- The stored timestamp is the winning runtime's T1 or T2, with the session owner as actor, and the losing request never overwrites it.
- Every Event field, lifecycle history row and other Registration field remains unchanged; DB/roster checked-in count is exactly 1, and roster timestamp matches the winning response.
- No 500 or deadlock occurs.

TEST-58(b) queues A's request at T1 while holding the Event lock. Only after observing its actual PostgreSQL lock wait does the test advance A's clock to ends+1 ms (`2026-11-06T07:00:00.001Z`) and release the lock. The response is 409 `CHECK_IN_NOT_OPEN`; the full Event/Registration/history snapshot is unchanged and roster count remains 0 with null attendance.

Each case uses isolated synthetic fixtures. A separate Prisma reader observes committed storage; finally blocks release barriers and drain pending HTTP requests before fixture cleanup. Readable per-round observations are retained as `F08_RACE`/`F08_LOCK_CLOCK` entries in the log, and [concurrency-summary.json](concurrency-summary.json) is derived from those actual observations.

## Results

| Verification | Result | Evidence |
| --- | --- | --- |
| Server typecheck including new suite | PASS | [typecheck.log](typecheck.log) |
| TEST-58(a) concurrency | 20/20 PASS; A/B each win 10 | [attendance-verification.log](attendance-verification.log) |
| TEST-58(b) clock after lock | 1/1 PASS; 409 and data unchanged | [attendance-verification.log](attendance-verification.log) |
| Existing TEST-53–57/MyRegistrationS3/router suites | 45/45 PASS | [attendance-verification.log](attendance-verification.log) |
| Combined attendance verification | 6 files, 66/66 PASS | [attendance-verification.log](attendance-verification.log) |

The existing production implementation passed these additional tests; no new RED or production change is claimed. [source-audit.json](source-audit.json) retains the new test SHA-256 and confirms source/Prisma files stayed unchanged during verification. Full regression/build/browser checks were not repeated for this test-only step; previous full-run evidence remains scoped to [its recorded source](../f08-own-green/README.md).

## Remaining gates

TEST-59 attendance UI/component/Chromium coverage and TEST-66 compiled-process restart remain. These local results do not establish the whole AC-46 (which also includes UI), full F-08 acceptance, GitHub CI, teammate review, staging merge or release verification.
