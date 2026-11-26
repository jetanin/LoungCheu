# F-08 TEST-56/57 — input, permissions and privacy verification

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- Baseline supplied by the student: `f4a1c5536ad3574b283d9b50405dd622eec84370`.
- Tested source: baseline plus uncommitted attendance access/router tests; retain the subsequent verification commit SHA for D2.
- Executed: 27 November 2026, 02:05 Asia/Bangkok (UTC timestamps and commands retained in logs).
- Runtime: Node v22.23.2; real PostgreSQL on Docker `127.0.0.1:55433`, database `loungcheu_test`; process-only environment overrides. The preserved port-5432 database was not used.

## Actual coverage/results

| Area | Cases and actual result |
| --- | --- |
| TEST-56 malformed paths | Either eventId or registrationId `not-a-uuid` → 400 INVALID_INPUT |
| TEST-56 rejected bodies | null, array, string, forged timestamp, forged status, >1 KiB, malformed JSON and wrong content type → 400 INVALID_INPUT |
| TEST-56 accepted bodies | No body and `{}` → 200; DB records server-clock timestamp/session owner; Event/history unchanged |
| TEST-57 mutation access | Anonymous → 401 AUTH_REQUIRED; PA checking self/PB → 403 ROLE_FORBIDDEN; OB → 404 EVENT_NOT_FOUND |
| TEST-57 record scope | Foreign-event registration → 404 REGISTRATION_NOT_FOUND; missing event → 404 EVENT_NOT_FOUND; missing registration → 404 REGISTRATION_NOT_FOUND |
| TEST-57 CSRF | Missing token, incorrect token and foreign Origin with otherwise correct token → 403 CSRF_FAILED |
| TEST-57 private attendance reads | PB reading PA's checked-in own detail → 404 REGISTRATION_NOT_FOUND and PB's own list remains empty; PA roster → 403 ROLE_FORBIDDEN; OB roster → 404 EVENT_NOT_FOUND |
| Router unit checks | Auth/role/CSRF rejection occurs before body parser/service; a forged organizer field is rejected before service; successful forwarding uses path IDs and session owner only |

Every API rejection compares all suite Event/Registration fields and lifecycle history using a separate Prisma reader connection. Errors have the exact public envelope with Thai text, and explicit assertions exclude fixture names, user/event/registration IDs and the attendance timestamp. Read-denial fixtures contain an existing check-in, so they exercise protection of real attendance data. Sessions and CSRF are obtained through actual auth endpoints in API tests; router unit tests isolate middleware ordering with injected handlers/service spies. Hooks remove only suite-owned synthetic fixtures.

| Verification | Actual result | Evidence |
| --- | --- | --- |
| Server typecheck, including both new test files | PASS | [typecheck.log](typecheck.log) |
| New TEST-56/57 API/DB cases | 25/25 PASS | [attendance-verification.log](attendance-verification.log) |
| New router unit cases | 5/5 PASS | [attendance-verification.log](attendance-verification.log) |
| Existing TEST-53/MyRegistrationS3, TEST-54 and TEST-55 | 15/15 PASS | [attendance-verification.log](attendance-verification.log) |
| Combined attendance verification | 5 files, 45/45 PASS | [attendance-verification.log](attendance-verification.log) |

These additional tests validate existing production behavior. No new RED or production change is claimed. [source-audit.json](source-audit.json) records test-file SHA-256 values and unchanged production-source verification during the run. Full regression/build/browser checks were not repeated for this test-only step; earlier full-run results remain scoped to [their recorded source](../f08-own-green/README.md).

## Remaining gates

TEST-58 concurrency/clock-after-lock, TEST-59 attendance UI/component/Chromium coverage and TEST-66 compiled-process restart remain. These local API/unit results do not establish full F-08 acceptance, GitHub CI, teammate review, staging merge or release verification.
