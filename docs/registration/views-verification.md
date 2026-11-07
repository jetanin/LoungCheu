# Issue #4 — My registrations and organizer roster

7 November 2026 (Asia/Bangkok). Uncommitted working tree on `feature/registration-views`, based on `feature/events` at `9fcbfc8`. No push or PR performed.

Implements baseline F-04/F-05 (FR-07/08, AC-18–23). No schema migration, cancellation, check-in, or attendance reporting.

## Behavior

- Participant navigation and registration success/recovery links open `/my/registrations`; entries open `/my/registrations/{id}`. Reload/re-login and application recreation read persisted records.
- Organizer event detail links to `/organizer/events/{id}/registrations`. Roster shows reference, display name, status, Bangkok registration time, and ACTIVE count. Focus/manual refresh reloads data.
- Own GET queries include session participant identity; list order is registered_at DESC, id ASC. Missing and foreign references both return 404 REGISTRATION_NOT_FOUND.
- Roster GET scopes Event by session owner, including empty/DRAFT events; foreign/missing events return 404 EVENT_NOT_FOUND. Order is registered_at ASC, id ASC. Rows/count use one REPEATABLE READ snapshot.
- Explicit Prisma selects and serializers expose only contract fields. Roster participant contains display_name only. Guards preserve auth → role → UUID input → record scope precedence.
- Private screens clear data during refresh and failures, remount on identity/role/resource changes, abort obsolete reads, discard late responses, and expose loading/empty/retry/401 handling.
- Restored optional maxConnections in createDatabaseClient to fix existing TS2554 and preserve deterministic PID/lock barriers in registration concurrency tests.

## Actual verification

| Command | Result |
|---|---|
| Focused new service/UI Vitest | 13 PASS |
| `npm test` outside sandbox | 15 files / 159 PASS, 0 FAIL/SKIP on Node24.15.0 and Node22.23.2, including 4 new real PostgreSQL/API cases and existing concurrency tests |
| `npm run typecheck` | PASS server/client/tools on Node24 and Node22 |
| `npm run build` | PASS client/server on Node24; Node22 client build PASS, server compilation completed separately after interrupting the command chain |
| Full Chromium (37 cases, ports5183/3011) | Interrupted after intermittent ERR_NETWORK_ACCESS_DENIED and blank-page/timeouts affecting baseline auth/event tests; not PASS |
| Focused Issue #4 Chromium | 2 FAIL at initial login-field timeout; no feature assertions reached. Direct CLI diagnostic confirmed ERR_NETWORK_ACCESS_DENIED loading /node_modules/.vite/deps/react-dom_client.js; diagnostic stopped after first failure, second case not run |
| `npm run test:built` outside sandbox | Node24 PASS, 3 compiled smoke checks. Node22 attempt failed at localhost listen EACCES |

Coverage:

- `server/tests/integration/registration-views.test.ts`: own schema/order/isolation, role/auth/UUID/missing records, empty DRAFT roster, ACTIVE/CANCELLED counts, fresh registration, logout/re-login/app recreation (TEST-22/23/26–29, API portion TEST-24).
- `server/tests/unit/registration-queries.test.ts`: 5 scoped-query/minimal response checks supplement real database tests.
- `client/src/features/registrations/RegistrationViews.test.tsx`: 8 cases for empty/error/retry, links/detail, account changes with delayed reads, 401/403/404 clearing, roster refresh, role guards (TEST-25/28/29).
- `tests/e2e/registration-views.spec.ts`: real UI publish → register → own detail → reload/re-login → owner roster (TEST-24/29/30); wrong-account denial. Separate test uses mocked reads for empty/error/401 UI states only.

## Attempts and limits

Initial new module import failure is **not** meaningful domain TDD evidence. Initial API assertion used future fixture timestamps (2098), so a real 2026 registration correctly sorted first instead of last; corrected fixture to past dates and used a controlled application clock. Full159 then passed. Sandbox database EACCES required approved escalation; these are environment attempts, not domain RED. Historical docs count145 differs from this checkout's observed142; 17 added cases yield159.

Supported Node22.23.2 was found at `C:/Users/jetan/AppData/Local/hermes/node/node.exe`. Its full test run completed159 PASS (79.23s), but tool output was buffered until interruption of the later server-build step. Typecheck and client build had also completed; server build was then run directly with Node22 and passed. Its compiled smoke encountered localhost listen EACCES despite approved escalation; the Node24 compiled smoke had passed. Browser verification remains blocked as recorded above. No app database migration/seed was run. Application recreation is not OS-process restart proof. Teammate review, independent UAT/clean reproduction, process restart, merge/release and deployment remain pending. No entire Sprint Product DoD claim.
