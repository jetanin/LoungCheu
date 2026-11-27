# TEST-59 synchronization and timeout diagnostics

Issue #50 / D2 #51. Local verification: Jetanin Naitho, 27 November 2026
(Asia/Bangkok). Base: `sprint-3-staging` `d520f0f`; this verification is for
the working changes on `fix/f08-evidence-e2e-stability`, before its commit.

## Observation and change

CI [run 45890686684](https://github.com/jetanin/LoungCheu/actions/runs/45890686684)
reported TEST-59 exceeding its 60-second budget. `browserContext.close` in the
test body's `finally` obscured the original stalled operation. A local run of
the original test (SHA-256
`84775a2d328650891d6d428cfe3289d8bbd65b9ba9cb17c9e4d74c7b30404809`)
reproduced two timeouts in ten repetitions. A proxy/backend connection timeout
also appeared during that run; the exact initiating cause is not established.

The test now:

- Registers its dialog wait before clicking and awaits both the click and
  completion of accept/dismiss. It closes the modal before asserting its type
  and participant-specific message.
- Owns the participant context through a Playwright fixture, separating browser
  teardown from the test body's DB cleanup.
- Bounds browser actions to 10 seconds and navigations to 15 seconds, retains
  the original total 60-second budget, and names sign-in, confirmation, response
  and screenshot steps. Failure traces and screenshots are retained locally.

All original behavior assertions remain: cancel sends zero mutations and leaves
the DB unchanged; confirm sends exactly one successful check-in; roster counts
and timestamp survive reload; own attendance survives fresh login and appears
in list/detail; Event and history stay unchanged; only the intended attendance
fields change. There are no sleeps, automatic retries, mocked responses, or
production code changes. This is a test-maintenance change, not a new feature
RED/GREEN claim; the original F-08 TDD evidence remains historical and unchanged.

## Verification

Node 22.23.2, real Chromium and backend, PostgreSQL test DB
`127.0.0.1:55433/loungcheu_test`; process-only environment overrides. Existing
port 5432 data is not used. Actual migrations initialize the disposable test DB
without resetting it.

Commands:

```text
node node_modules/typescript/bin/tsc -p tsconfig.tools.json --noEmit
node node_modules/@playwright/test/cli.js test tests/e2e/attendance.spec.ts --repeat-each=10 --retries=0
node node_modules/@playwright/test/cli.js test --retries=0
```

Selected actual output and final counts are in [verification.log](verification.log).
Results: original test **8 passed / 2 failed / 0 skipped**; revised TEST-59
**10 passed / 0 failed / 0 skipped** with retries disabled; full Chromium suite
**41 passed / 0 failed / 0 skipped**; tools/test TypeScript check exit 0.
The revised stress and regression logs identify the same final TEST-59 source
by SHA-256. An AST comparison confirms all 24 original expect assertions remain.
The baseline is the original TEST-59 from PR #75 head `7553660`, byte-identical
to staging `d520f0f`; the revised runs use the current fix working tree. Passing
repetitions demonstrate the observed result, not a guarantee against every
future infrastructure or browser timeout. CI on the committed PR head is still
required before merge.
