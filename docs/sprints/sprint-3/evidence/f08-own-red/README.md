# F-08 own attendance — TEST-53 / MyRegistrationS3 RED

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- Baseline supplied by the student: `5206254a9b14c6a818d734655a331623ef25c686` (TEST-55 GREEN).
- Source tested: baseline plus uncommitted `server/tests/integration/attendance-own.test.ts`. Retain the subsequent RED commit SHA for D2; this baseline is not the new RED commit.
- Executed: 27 November 2026, 01:40 Asia/Bangkok; UTC timestamps retained in logs.
- Node v22.23.2; real PostgreSQL on Docker `127.0.0.1:55433`, database `loungcheu_test`; process-only environment overrides. The preserved database on port 5432 was not used.

## Actual results

| Check | Observed result | Evidence |
| --- | --- | --- |
| Server typecheck | PASS, exit 0 | [typecheck.log](typecheck.log) |
| Existing check-in rule TEST-55 | 3/3 PASS | [check-in-baseline.log](check-in-baseline.log) |
| TEST-53: public check-in → roster → own detail/list | RED: check-in and roster succeed with the expected timestamp, DB actor and unchanged lifecycle history; both own reads omit `checked_in_at` instead of returning that timestamp | [own-attendance-red.log](own-attendance-red.log) |
| MyRegistrationS3: unchecked ACTIVE | RED: both own reads omit the required `checked_in_at` instead of returning null | [own-attendance-red.log](own-attendance-red.log) |
| MyRegistrationS3: CANCELLED | RED: both own reads omit the required `checked_in_at` instead of returning null | [own-attendance-red.log](own-attendance-red.log) |

New suite: 3 failed / 3, expected RED. Failures are HTTP-response assertions, not type/import/schema/setup errors. The exact-schema, subsequent read-only DB snapshot and other assertions following each failing assertion still require GREEN verification.

The tests use real owner/participant session login and CSRF for the mutation, an injected clock at t0+2h30m, isolated synthetic fixtures, and a separate Prisma connection to inspect committed storage. Hooks delete only the suite's fixtures. The successful journey compares all Event, Registration and lifecycle history fields, checks the roster response, and then requires the same UTC timestamp in own detail and own list. Exact own-response schema excludes the organizer actor ID.

No production changes were made for this RED step. [source-audit.json](source-audit.json) records the test-file SHA-256 and confirms production source and Prisma files did not change during verification.

## Next gate

Commit the new test and this evidence separately before extending own registration selection/serialization. Keep the tests unchanged for GREEN and adjust existing exact-schema regression expectations only for the new required field. This API step does not establish TEST-59 component/Chromium UI coverage or TEST-66 process-restart persistence, which remain separate work.
