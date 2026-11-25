# F-06 — API matrix and deterministic race verification

Executed 24 November 2026, approximately 02:30–02:34 Asia/Bangkok.
Contract reference: TEST-40/41/42, AC-28–33; access/error NFR-01/06 and concurrency NFR-04.

## Version and scope

Production source under verification is the user-supplied UI GREEN commit **`5b12163e1f3837c141bb93773fe45e9e44ec3308`**. Earlier TDD evidence is retained separately:

- API RED: `33ac9576a980ee72621ab7c472b628774f4f2dc3` → API GREEN: `0321258975fba373a92d847ea756f9caf397477f`.
- UI RED: `3f21204a936714f8ae33f9b01e344db1e926dcf7` → UI GREEN: `5b12163e1f3837c141bb93773fe45e9e44ec3308`.

This step adds supplemental verification tests and evidence only. All new cases passed against the existing implementation, so this is **not** claimed as another RED/GREEN implementation cycle. No production source was changed, and the assistant ran no Git commands. The user records this verification commit SHA after committing.

## API matrix

`registration-lifecycle-hardening.test.ts` verifies all three mutation boundaries (register/reactivate, cancel, close):

- Reject JSON null/array/primitive, malformed JSON, unexpected/spoofed fields, invalid content type, parser overflow and invalid UUIDs.
- Accept absent body and `{}` when the domain permits the operation.
- Observe auth → role → CSRF/Origin → input → scope/domain precedence; reject another session's token and cross-origin requests.
- Mask foreign/missing records with the contracted 404 code, with exact error envelopes and no private reference/internal SQL/password/CSRF details in the response.
- Check reactivate at deadline−1 ms/equality/+1 ms, event-open ahead of duplicate/full/cancelled state, duplicate ahead of capacity, and unchanged rejected rows/history/timestamps.

Snapshots are read after responses/transactions finish and compare Event fields (including updated_at), Registration fields and all history rows. Tests use unique fixture IDs and delete only their own data, in history → registration → event order.

## Real PostgreSQL race protocol

Two application runtimes each use a separate Prisma pool capped at one connection. Each writer uses a real login/session/CSRF token. A third connection holds the target Event row; `pg_stat_activity` confirms the first writer is waiting before the second writer starts, and confirms both wait before releasing the row. Connection PIDs are checked to be distinct.

This observes both queue orders rather than relying only on simultaneous Promise scheduling. Requests always settle before fixture cleanup, even if a lock-barrier assertion fails.

| TEST-42 group | Fresh rounds | Observed outcome |
|---|---:|---|
| Double cancel | 20 | One 200, one ALREADY_CANCELLED; one CANCELLED history addition |
| Double reactivate | 20 | One 200, one ALREADY_REGISTERED; one REACTIVATED history addition |
| Reactivate vs new last-seat registration | 20 | First queued operation succeeds (200/201), loser EVENT_FULL; one ACTIVE seat, original reference retained |
| Close vs create | 20 | Close-first rejects create; create-first commits before close and its state/history remain |
| Close vs reactivate | 20 | Close-first rejects reactivate; reactivate-first commits before close and its state/history remain |
| Close vs cancel | 20 | Close-first rejects cancel; cancel-first commits before close and its state/history remain |
| Cancel waits across deadline | 20 | Clock advances only after the writer is observed waiting; REGISTRATION_CLOSED and unchanged state/history |
| Reactivate waits across deadline | 20 | Same post-lock clock rule; REGISTRATION_CLOSED and unchanged state/history |
| **Total** | **160** | All rounds completed without deadlock, HTTP 500, overbooking or duplicate history in the asserted outcomes |

The first six groups alternate the queued order/connection across the twenty rounds. The two deadline groups have one waiting writer whose clock crosses the deadline before the held lock is released. Twenty loop rounds per group are distinct from the Vitest test-case count.

## Commands and results

Run from the repository root with a process-only TEST_DATABASE_URL override for the user-approved Docker test database on **55433**, named `loungcheu_test`. Credentials are omitted here. The original 5432 data and `.env.test` remain unchanged.

```powershell
npm.cmd run typecheck
npm.cmd test -- server/tests/integration/registration-lifecycle-hardening.test.ts --reporter=verbose
npm.cmd test -- --reporter=dot
```

| Check | Actual result | Evidence |
|---|---|---|
| Typecheck (server, client, tools) | PASS; exit 0 | Command output observed |
| Supplemental matrix/race tests | 21 PASS, 0 FAIL/SKIP; 160 race rounds within 8 test cases; exit 0 | [Targeted log](api-hardening.log) |
| Full Vitest regression with the new suite | 19 files, 209 PASS, 0 FAIL/SKIP; exit 0 | [Regression log](vitest-regression.log) |

## Remaining work

This does not prove migration/backfill/seed/rollback-specific TEST-44, the actual OS-process restart test for NFR-03, full F-06 browser lifecycle journeys or the remaining UI error/timeout/late-response cases. TEST-44(c) stays in the separate integration PR after both #47/#48 merge, and F-07 TEST-47 adopts the real close endpoint after integration. Release/CI/review/deployment and completion/traceability documentation are still required before Issue #47 is Done.
