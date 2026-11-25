# F-06 — real Chromium lifecycle verification

Executed 24 November 2026, approximately 12:34–12:39 Asia/Bangkok.
Source before test additions: user-supplied migration GREEN commit
`8d827dc72f6915b6819519a233b8d2d641ee3c53`.

## Scope and environment

This step adds `tests/e2e/registration-lifecycle.spec.ts` and evidence only;
production implementation and the earlier RED assertions are unchanged.
These are additional verification tests for already implemented behaviour,
not a new implementation RED/GREEN cycle.

Real headless Chromium uses UI port 5183 and API port 3011. The API, sessions,
CSRF and PostgreSQL are real; no API responses are mocked in the new journey.
The process-only TEST_DATABASE_URL selects the approved Docker test database
`loungcheu_test` on **55433**. `.env.test` and original data on 5432 are unchanged.
The existing E2E bootstrap resets test account passwords on this test database;
the journey creates its own event through the UI. Test records remain in that
disposable database, following the existing browser-test convention.

## TEST-43 verification

- Organizer creates a one-seat DRAFT and publishes through the UI.
- Participant A registers (HTTP 201), then dismisses cancel confirmation:
  zero cancel POSTs and persisted status stays ACTIVE.
- Confirmed cancel sends one POST, displays CANCELLED and the cancellation
  time in Bangkok, and retains the original reference/first timestamp.
- Reload and actual UI logout/re-login retain the cancelled registration in
  own list/detail. The test waits for logout HTTP 204 and checks `/auth/me`
  returns 401 before signing in again.
- Participant B takes the returned seat. A sees the cancelled/full explanation
  and no re-registration button. After B cancels, A refreshes and re-registers
  (HTTP 200), using the original reference/first timestamp and cancelled_at=null.
- Organizer roster has exactly two data rows, the common first-registration
  label, and A's original time. Reactivation does not add a row.
- Dismissing close confirmation sends zero close POSTs. Accepting sends one,
  displays CLOSED and removes the close action. Owner reload retains CLOSED;
  A's refreshed own detail has no cancel action, and B sees the cancelled/closed
  explanation without re-registration.
- Read-only Prisma queries scoped to this UI-created event verify two
  Registration rows, one ACTIVE, CLOSED Event, A's original timestamp and
  null cancellation time. A history is exactly REGISTERED→CANCELLED→REACTIVATED
  with the participant actor; B history is REGISTERED→CANCELLED. Close adds
  no history. No fixture writes or test-only history endpoint bypass the flow.

## Results and retained attempts

| Check | Result | Evidence |
|---|---|---|
| New lifecycle journey + selected existing registration browser regression | **4 PASS, 0 FAIL**, exit 0 | [Final Chromium log](chromium-regression-final.log) |
| Workspaces + tooling typecheck after final changes | **PASS**, exit 0 | [Typecheck](typecheck.log) |
| Mobile cancelled detail, 390 px wide | Visually inspected; reference wraps and labels/times remain readable | [Screenshot](cancelled-mobile.png) |
| Cancelled participant on CLOSED event | Visually inspected; explanation shown, no re-registration action | [Screenshot](cancelled-closed.png) |

Retained failed development attempts are not product RED evidence:

- [Initial run](chromium-first-run.log): timeout, with cleanup masking the
  original failure. Subsequent runs add bounded action waits, failure logging
  and concurrent context cleanup.
- [Diagnostic run](chromium-diagnostic.log): a broad timestamp selector matched
  two fields when registration/cancellation happened within the same displayed
  second. The corrected selector targets only the `dd` adjacent to its `dt`.
- [First selected regression](chromium-regression.log): 3 PASS, 1 FAIL because
  re-login navigation raced the still-pending logout request. The test now
  waits for server-side logout as described above. No application change was
  made to obtain the final pass.

Reproduction from repository root, with TEST_DATABASE_URL set for Docker 55433
(credentials omitted):

```powershell
$env:E2E_WEB_PORT='5183'
$env:E2E_API_PORT='3011'
npm.cmd run test:e2e -- tests/e2e/registration-lifecycle.spec.ts tests/e2e/events-registration.spec.ts tests/e2e/registration-views.spec.ts
npm.cmd run typecheck
```

## Limits and next step

The four passing tests are the selected registration browser suite, not the
entire repository E2E suite or independent UAT. Actual backend process-restart
coverage is recorded separately in [migration GREEN](../f06-migration-green/README.md).
The prior 218/218 Vitest regression belongs to that earlier SQL change; it was
not rerun here because this step changes browser tests and evidence only.

Remaining F-06 work includes component coverage for mutation busy/409/401/network
uncertainty and stale lookup/session/event responses, followed by completion,
traceability/System SDS updates and final full regression/CI/review/release.
TEST-44(c) remains a separate integration PR after both feature PRs merge into
staging. This step does not close #47 or mark the feature Done. The assistant
ran no Git commands.
