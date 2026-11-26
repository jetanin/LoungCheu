# F-08 own attendance — TEST-53 / MyRegistrationS3 GREEN

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- RED commit: `4af205b2bd16bb1fcd49c33d7db5bd6ae26f35f4`.
- Source verified: RED commit plus uncommitted GREEN implementation. Retain the subsequent GREEN commit SHA for D2.
- Execution: 27 November 2026, Asia/Bangkok; UTC start times and exact commands appear in each log.
- Runtime: Node v22.23.2; PostgreSQL on Docker `127.0.0.1:55433`, database `loungcheu_test`, with process-only environment overrides. The preserved port-5432 database was not used.

## Change and observed behavior

Own registration selection and serialization now include required `checked_in_at` as a UTC ISO timestamp or null. Both list and detail retain their participant scope and existing ordering/fields; neither selects or exposes `checked_in_by_id`. The existing cancellation serializer also returns the added field. No schema, migration, check-in service, route or UI change was needed in this step.

The unchanged RED suite now passes 3/3:

1. TEST-53 executes a real owner check-in at t0+2h30m, checks the committed DB timestamp/actor and unchanged Event/history/other registration fields, reads the roster, then reads the participant's own detail and list. All three responses carry the same timestamp, and the subsequent reads leave DB state unchanged.
2. An unchecked ACTIVE registration returns required `checked_in_at: null` in own detail and list.
3. A CANCELLED registration returns required `checked_in_at: null` in both reads.

Exact own-response schema assertions exclude the actor ID. Existing unit/integration schema expectations were extended only for the required new field, retaining earlier data, ownership, privacy and ordering assertions.

TEST-53 RED source SHA-256: `e8d050f2559a44466ded1a54a7ce9275e2ce2ace52612d0309e9614a5e0be8fe`. It must remain unchanged from the [RED evidence](../f08-own-red/README.md); [test-audit.json](test-audit.json) records the verification.

## Results

| Verification | Actual result | Evidence |
| --- | --- | --- |
| Workspace/server/client/tools typecheck | PASS | [typecheck.log](typecheck.log) |
| TEST-53 + MyRegistrationS3 | 3/3 PASS | [attendance-green.log](attendance-green.log) |
| Existing TEST-55 check-in rule | 3/3 PASS | [attendance-green.log](attendance-green.log) |
| Full Vitest regression, including migration and lifecycle tests | 28 files, 279/279 PASS | [vitest-regression.log](vitest-regression.log) |
| Production client/server build | PASS | [build.log](build.log) |
| Compiled production smoke | 4/4 PASS | [built-smoke.log](built-smoke.log) |
| Existing Chromium regression (API 3011 / web 5183) | 39/39 PASS | [chromium-regression.log](chromium-regression.log) |

## Remaining scope

This establishes the own attendance API portion, not full F-08 acceptance. Full input/access matrix, boundary and cross-feature cases, concurrency/lock-wait tests, attendance UI/component/Chromium coverage (TEST-59) and compiled-process restart (TEST-66) remain separate work. Browser regression for the existing application does not prove the planned attendance UI. GitHub CI, teammate review, staging merge and release verification are later gates.
