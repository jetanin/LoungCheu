# F-08 check-in rule — TEST-55 GREEN

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- RED commit: `cca5f331e8123f83dd743b90960d530a5b725855`.
- Source verified: RED commit plus uncommitted GREEN changes; record the subsequent GREEN commit SHA in D2.
- Execution date: 27 November 2026, Asia/Bangkok; each log retains its UTC start time.
- Runtime: Node v22.23.2, PostgreSQL on Docker `127.0.0.1:55433`, `loungcheu_test`; process-only environment overrides. The preserved port-5432 database was not used.

## Change and verified behavior

The new attendance router/service implements owner-scoped check-in through the public API. It locks Event before Registration, reads the clock after the locks, then checks the time window, ACTIVE status and existing attendance in that order. A successful transaction writes the first timestamp and organizer ID together, returns RosterEntryS3 without the organizer ID, and leaves Event and lifecycle history unchanged. Roster reads add `checked_in_count` and each row's required nullable `checked_in_at` in the existing repeatable-read snapshot.

The unchanged TEST-55 RED test now passes all three cases:

1. CANCELLED during the event returns 409 `REGISTRATION_NOT_ACTIVE`; Event, registrations, history and checked-in count remain unchanged.
2. First check-in at T1 returns 200 and stores T1/the owner. Repeating at T2, five minutes later, returns 409 `ALREADY_CHECKED_IN`; T1, actor, all registration fields, Event, history and roster count remain unchanged.
3. CANCELLED after ends+1 ms returns 409 `CHECK_IN_NOT_OPEN`, proving time validation takes precedence; no data changes.

The test file SHA-256 remains `af8f8a4774c7af4448ef757bdf85cc3295aa292a5cffc0f1629393e3aad8e831`, matching RED. See [test-audit.json](test-audit.json) and the [RED record](../f08-check-in-red/README.md).

## Results

| Verification | Actual result | Log |
| --- | --- | --- |
| Full workspace/tools typecheck | PASS | [typecheck.log](typecheck.log) |
| TEST-55 / AC-43 | 3/3 PASS | [check-in-green.log](check-in-green.log) |
| Full Vitest regression, including TEST-65 migration baseline | 27 files, 276/276 PASS | [vitest-regression.log](vitest-regression.log) |
| Production client/server build | PASS | [build.log](build.log) |
| Compiled production smoke | 4/4 PASS | [built-smoke.log](built-smoke.log) |
| Existing Chromium regression (API 3011 / web 5183) | 39/39 PASS | [chromium-regression.log](chromium-regression.log) |

The first full regression attempt found three failures in old exact roster-schema expectations. Only the new required roster fields were added to those expectations and the mocked rows; existing ownership, ordering, privacy and data assertions were retained. The final regression above passes. TEST-55 was not edited.

## Remaining scope

This is local verification of TEST-55, not completion or acceptance of F-08. Own attendance serialization/UI, organizer check-in UI, full input/access matrix, time-boundary/cross-feature cases, concurrent check-in and lock-wait tests, and the compiled-process restart test remain for subsequent steps (TEST-53–54, TEST-56–59, TEST-66). Existing browser regression does not prove the planned attendance UI. GitHub CI, teammate review, staging merge and release verification are separate gates.
