# F-08 check-in rule — TEST-55 RED

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- Baseline supplied by the student: `a8ff503dc4d316a6f36c90ccda2a437919d83339`.
- Source tested: baseline plus the new, uncommitted `server/tests/integration/attendance-check-in.test.ts`. Record the subsequent RED commit SHA in D2; the baseline is not the RED commit.
- Execution: 27 November 2026, 01:22 Asia/Bangkok (UTC timestamps are retained in each log).
- Runtime: Node v22.23.2; real PostgreSQL on Docker `127.0.0.1:55433`, database `loungcheu_test`, with process-only environment overrides.

## Scope and observed results

This is the separate RED step for AC-43 / TEST-55, following the merged F-08 storage migration. It does not establish completion of the whole F-08 contract.

| Check | Observed result | Evidence |
| --- | --- | --- |
| Server TypeScript check | PASS, exit 0 | [typecheck.log](typecheck.log) |
| Existing TEST-65 migration baseline | PASS, 8/8 | [migration-baseline.log](migration-baseline.log) |
| TEST-55(a), cancelled registration during event | RED: HTTP 404, expected 409 `REGISTRATION_NOT_ACTIVE` | [check-in-red.log](check-in-red.log) |
| TEST-55(b), first check-in and repeat at a later time | RED: first request HTTP 404, expected 200 | [check-in-red.log](check-in-red.log) |
| TEST-55(c), outside window and cancelled | RED: HTTP 404, expected 409 `CHECK_IN_NOT_OPEN` | [check-in-red.log](check-in-red.log) |

All three new tests reached the public HTTP endpoint with an authenticated owner session and CSRF token. The endpoint is not implemented at this baseline, so they fail on HTTP assertions, rather than missing imports, type errors or missing migrations. Assertions after those failures have not yet run; their data-preservation and roster expectations still require GREEN verification.

The tests use isolated synthetic users/events, an injected clock, real migrated storage and a separate Prisma reader connection. They specify preservation of event fields, registration fields and lifecycle history on rejection; the successful case specifies the first timestamp/actor, unchanged history and roster count, including a repeat five minutes later.

No production implementation was added for this RED step. [source-audit.json](source-audit.json) records the unchanged-production-source check, test-file SHA-256 and process exit codes. The test hooks remove their own fixtures. The preserved database on port 5432 was not used.

## Next gate

Commit this test and evidence as a separate RED commit, retain its SHA for D2, then implement the check-in endpoint and verify GREEN without weakening these assertions.
