# F-06 — UI error, pending request and stale response verification

Executed 24 November 2026 (Asia/Bangkok). Source before these additions:
user-supplied commit `67efa937a8f1bf38b21c77b2820fcef9ebfd3152`.

This step adds `RegistrationLifecycleEdges.test.tsx` and evidence only.
Production implementation and all earlier RED tests are unchanged. The new
behavioural checks pass against the existing implementation; this is additional
verification, not a new product RED/GREEN cycle.

## TEST-43 checks

The new file contains **24 cases**:

- Cancel and close each keep a pending write busy, reject repeated clicks and
  send exactly one POST; a CSRF bootstrap failure sends no mutation and leaves
  explicit retry available.
- Both actions treat network failure after send and the actual 15-second abort
  timeout as uncertain. They do not automatically replay a write. A failed
  status read keeps the mutation disabled; a successful read permits an explicit
  retry without sending a POST itself.
- Integrated own-detail and owner-event views clear private data after mutation
  401/403/404. Only 401 requests authentication; unavailable actions disappear.
- Cancel/close 409 refreshes to CLOSED, removes the action and retains the Thai
  rejection message instead of losing it during refresh.
- Failed own-registration lookup can be retried and resolves to the existing
  CANCELLED record, using the re-registration action.
- Late own-lookup results (both an ACTIVE record and a 401) cannot overwrite a
  newly selected account/event or sign that new session out.
- A newer focus read returning CANCELLED wins over an older ACTIVE lookup.
- A current-session own-lookup 401 removes an already displayed private success
  reference and prevents a pending mutation's late success from restoring it.

Deferred promises control response order; stale-response mocks deliberately
resolve despite abort so tests prove the UI discards late data. Timer tests
advance the actual 15-second client timeout and reject fetch on its abort
signal. No HTTP service or database is used in these jsdom tests.

## Results

| Check | Result | Evidence |
|---|---|---|
| Initial 21-case slice | 21 PASS | [First run](first-run.log) |
| Expanded registration component suite | 61 PASS in 5 files | [Expanded run](registration-components.log) |
| Final registration component suite after typing correction | 61 PASS in 5 files, exit 0 | [Final run](registration-components-final.log) |
| Workspaces and tooling typecheck | PASS, exit 0 | [Typecheck](typecheck.log) |

[Initial typecheck](typecheck-first-run.log) failed because seven Testing Library
`getByRole` calls used Playwright's unsupported `exact` option. They now use an
anchored accessible-name regex (`/^ลงทะเบียน$/`). This was a test-authoring type
error, not a product behaviour RED. Both tests and typecheck were rerun after
the correction.

Commands from the repository root:

```powershell
npm.cmd test -- client/src/features/registrations --reporter=verbose
npm.cmd run typecheck
```

The 61 total includes 24 new cases and 37 existing registration component
checks. It is not the complete Vitest or E2E suite. Earlier real Chromium and
restart evidence is retained in [browser verification](../f06-browser/README.md)
and [migration GREEN](../f06-migration-green/README.md). No database operations,
Git commands, issue/board updates, PR creation or merge occurred in this step.

## Next step

Reconcile implementation/evidence into the F-06 completion documentation,
traceability and System SDS, then run the final full regression before review.
CI, teammate review, merge and release acceptance remain outstanding. TEST-44(c)
remains the separate agreed integration PR after #47 and #48 reach staging;
these local passes do not mark Issue #47 Done.
