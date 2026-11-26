# F-08 TEST-54 / AC-42 — boundary and cross-feature verification

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- Baseline supplied by the student: `081b6eb2e18eb3fc962d0beafb1a584989b80751`.
- Tested source: baseline plus uncommitted `server/tests/integration/attendance-boundaries.test.ts`. Retain the subsequent verification commit SHA in D2.
- Executed: 27 November 2026, 01:59 Asia/Bangkok; UTC start timestamps and commands retained in logs.
- Runtime: Node v22.23.2; real PostgreSQL on Docker `127.0.0.1:55433`, database `loungcheu_test`. Process-only environment overrides; the preserved port-5432 database was not used.

## Actual results

| TEST-54 case | Observed HTTP/result |
| --- | --- |
| (a) starts−1 ms | 409 CHECK_IN_NOT_OPEN; DB unchanged |
| (b) starts exactly | 200, exact clock timestamp/owner persisted |
| (c) ends exactly | 200, exact clock timestamp/owner persisted |
| (d) ends+1 ms | 409 CHECK_IN_NOT_OPEN; DB unchanged |
| (e) actual POST close → check-in during event | CLOSED confirmed in response and DB; check-in 200 |
| (f) create DRAFT → PATCH schedule → publish → register → check-in, inside old window but before new start | 409 CHECK_IN_NOT_OPEN; DB unchanged |
| (f) same real workflow, new start exactly | 200 |
| (f) same real workflow, new end exactly and after old end | 200 |
| (f) same real workflow, new end+1 ms | 409 CHECK_IN_NOT_OPEN; DB unchanged |

Each case gets a fresh event/registration. Successful cases compare every Event and Registration field plus lifecycle history, allowing only the two attendance fields to change; rejection cases compare the entire before/after snapshot. Roster count and row timestamp are read back. A separate Prisma connection checks committed storage. Real sessions are renewed at the test clock so session expiry does not mask time-boundary behavior. Hooks remove only suite-owned synthetic fixtures.

| Verification | Result | Evidence |
| --- | --- | --- |
| Server typecheck, including new test | PASS | [typecheck.log](typecheck.log) |
| TEST-54 / AC-42 | 9/9 PASS | [attendance-verification.log](attendance-verification.log) |
| Existing TEST-53/MyRegistrationS3 and TEST-55 | 6/6 PASS | [attendance-verification.log](attendance-verification.log) |
| Combined attendance suites | 3 files, 15/15 PASS | [attendance-verification.log](attendance-verification.log) |

These are additional verification tests for behavior already implemented during the earlier RED/GREEN steps. They passed on their first execution; no new RED or production implementation change is claimed. [source-audit.json](source-audit.json) records the new test SHA-256 and unchanged production-source check during verification.

Full regression/build/browser checks were not repeated for this test-only step. Their prior results remain in [own attendance GREEN evidence](../f08-own-green/README.md) and apply to that recorded source, not a newly claimed full-suite run here.

## Remaining gates

TEST-56/57 input/access matrix, TEST-58 concurrency/clock-after-lock, TEST-59 attendance UI/component/Chromium coverage and TEST-66 compiled-process restart remain. This result is local verification, not GitHub CI, teammate approval, a staging merge or F-08 acceptance.
