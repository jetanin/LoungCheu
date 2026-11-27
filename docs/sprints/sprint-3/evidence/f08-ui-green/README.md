# F-08 TEST-59 — attendance UI GREEN

- Student: Jetanin Naitho (เจตนินทร์ นายโท).
- UI RED commit: `54deba90eb510cf0626066367464f2ecc1bfc6bb`.
- Verified implementation GREEN commit: `30135da345076c82947b5493cd39262783d73b11`. The execution logs describe RED plus uncommitted GREEN changes because verification ran before this commit; the student subsequently committed that verified implementation. Later documentation-only updates record this SHA without claiming a new implementation test run.
- Execution: 27 November 2026, Asia/Bangkok; exact UTC start times, commands and exit codes are retained in each log.
- Runtime: Node v22.23.2; PostgreSQL on Docker `127.0.0.1:55433`, database `loungcheu_test`. Test-owned databases for migration/restart use the same approved instance. Process-only overrides; the preserved port-5432 database was not used. Browser API/web ports are 3011/5183.

## Implementation

`RegistrationViews.tsx` displays required own attendance for ACTIVE records in list and detail: checked timestamp or "ยังไม่ได้เช็กชื่อ"; CANCELLED omits this section. No organizer actor identity is displayed.

The owner roster reads its existing roster endpoint and the existing owner-event detail endpoint together. The event supplies starts/ends; no new endpoint or roster API field is introduced for the schedule. Both reads must succeed before displaying the combined view. Rows add an attendance column, and the heading shows the authoritative checked-in/ACTIVE count.

`AttendanceAction.tsx` handles a named confirmation, current-window guard, inclusive boundaries and a per-row single-flight/busy state. CANCELLED has a dash; previously checked-in rows show their Bangkok timestamp; unchecked rows outside the window show the allowed time range. A boundary timer updates action availability. CLOSED events follow the same schedule rule.

A successful POST updates that row from the response then reloads the roster; functional state updates preserve other rows when several mutations finish. Domain 409 text remains visible while the roster refreshes. Mutation 401 clears private data and invokes login handling; 403/404 clear the roster and show the error. Pending reads/mutations have generation/mount/abort guards and keyed account/event scope. An uncertain sent request is never automatically retried; the row blocks retry and offers explicit "โหลดรายชื่อใหม่" reconciliation. Fetch uses a 15-second abort timer. Existing F-06 cancellation/close mutation code was not changed.

The two original RED test files remain byte-for-byte unchanged. [test-audit.json](test-audit.json) records their hashes, matching the [RED evidence](../f08-ui-red/README.md). Two legacy roster component fixtures were updated to return the existing owner-event schedule and new required attendance fields; their original assertions were retained.

## Observed results

| Verification | Actual result | Evidence |
| --- | --- | --- |
| Workspace/server/client/tools typecheck | PASS | [typecheck.log](typecheck.log) |
| Unchanged TEST-59 component suite | 21/21 PASS, previously 19 failed / 2 passed | [component-green.log](component-green.log) |
| All client tests | 101/101 PASS across 8 files | [client-regression.log](client-regression.log) |
| Focused real TEST-59 Chromium journey | 1/1 PASS | [chromium-focus.log](chromium-focus.log) |
| Full Vitest regression including TEST-65/66 and Sprint 1–2 | 34 files, 361/361 PASS | [vitest-regression.log](vitest-regression.log) |
| Production client/server build | PASS | [build.log](build.log) |
| Compiled production smoke | 4/4 PASS | [built-smoke.log](built-smoke.log) |
| Full Chromium regression | 40/40 PASS | [chromium-regression.log](chromium-regression.log) |

Final-run screenshots: [owner roster](attendance-roster.png), [participant own detail](attendance-own-detail.png). Both contain synthetic test data and were visually inspected for layout; no credentials are shown.

The real browser journey dismisses a confirmation with zero POSTs and unchanged DB, then accepts it and sends exactly one POST. Roster row/count survive reload; participant own list/detail show the same timestamp after logout/login and reload. All Event fields, lifecycle history and other registration fields remain unchanged. No API responses or browser clock are mocked in this journey. Synthetic in-progress fixtures are removed after the test.

Component tests simulate an uncertain sent POST rejecting with AbortError; this is behavioral coverage, not a claim that the test waited 15 real seconds. Independent API/DB concurrency and actual compiled-process restart coverage are linked below.

## F-08 local evidence map

| Contract tests | Local evidence |
| --- | --- |
| TEST-53 / MyRegistrationS3 own API | [3 passing cases](../f08-own-green/README.md) |
| TEST-54 inclusive time bounds, actual close and edited schedule | [9 passing cases](../f08-boundaries/README.md) |
| TEST-55 ACTIVE/cancelled/repeat/time-before-status | [3 passing cases](../f08-check-in-green/README.md) |
| TEST-56/57 input, scope, role, CSRF and privacy | [25 API + 5 router unit cases](../f08-access/README.md) |
| TEST-58 two-runtime races and clock-after-lock | [20 races + 1 lock-clock case](../f08-concurrency/README.md) |
| TEST-59 attendance component/browser UI | This record |
| TEST-65 migrations, fresh/repeated/concurrent seed and constraints | [8 passing cases](../f08-migration-green/README.md) |
| TEST-66 actual compiled backend process restart | [Persistence, two PIDs and fresh logins](../f08-restart/README.md) |

## TDD trace

| Slice | Separate RED commit | GREEN commit |
| --- | --- | --- |
| Storage/migration | `ba4cb6e0ff369e5a573fe97240214832f24b534d` | `61d1a05812e78e09a70f2ff8b1644046b4b7749e` |
| Check-in rule API | `cca5f331e8123f83dd743b90960d530a5b725855` | `5206254a9b14c6a818d734655a331623ef25c686` |
| Own attendance API | `4af205b2bd16bb1fcd49c33d7db5bd6ae26f35f4` | `081b6eb2e18eb3fc962d0beafb1a584989b80751` |
| Attendance UI | `54deba90eb510cf0626066367464f2ecc1bfc6bb` | `30135da345076c82947b5493cd39262783d73b11` |

Additional boundary/access/concurrency/restart tests passed on existing implementation; their records explicitly do not invent a new RED. An initial client regression attempt found two outdated mocked roster reads; the fixtures were updated for the required event detail read and attendance schema before the retained passing client run.

## Remaining review/release gates

These are local results. Teammate review, CI `test-and-docker` on the PR head, staging merge, integration with F-09, deployment/version verification and independent acceptance remain separate gates. Do not mark #50 accepted/Done or close it solely from this local record.
