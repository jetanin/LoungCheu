# F-06 / F-07 — staging merge resolution and combined verification

24 November 2026, Asia/Bangkok. The user ran
`git merge origin/sprint-2-staging` while on `feature/47-f06` and supplied the
four-file conflict output. The assistant edited the working files and ran
checks, but executed **no Git commands**, staged nothing and did not create a
merge commit. The user must record the resulting merge SHA after verification.
The prior F-06 reconciliation commit supplied by the user was
`a8c568bdc28fe299f65c7b3e0e3ab4ff1e693100`; incoming F-07 was reviewed separately
at `9eb9afba8b6c75f9b832e5b860ebe30835eb8706`. These are source-history
references, not a claim that either is the as-yet-uncreated merge commit.

## Resolutions

- `server/src/modules/events/service.ts`: retain close and update as separate
  complete blocks, with their original guards, Event locks, clocks and output
  serialization. Do not choose one branch and lose the other method.
- `docs/sprints/sprint-2/contracts.md` and `sts.md`: preserve both branches'
  v0.6 revision rows and F-07 test-design refinements. Add v0.7 explaining the
  integration; no AC/TEST IDs or acceptance rules changed.
- `docs/system-sds.md`: retain F-06 schema/history/cancel/close changes and
  F-07 PATCH/edit route/errors/UI documentation; clarify implemented vs planned.
- Auto-merged `EventPage.tsx`, Event router, input and shared API helper retain
  both features. Edit precedes close in the owner action row. F-07 published
  refresh/404 fixes and F-06 busy/uncertainty/own lookup behaviour are retained.

## Test compatibility correction

[First targeted F-07 run](f07-before.log): **7 assertions passed**, but suite
cleanup failed with `registration_history_registration_id_fkey` because it
deleted Registration before the history produced by the combined service.
This is an integration fixture/cleanup failure, not a new product-domain RED.

`event-edit.test.ts` now creates REGISTERED history atomically with fixture
registrations and cleans only event IDs owned by that suite, children first
in one transaction. Runtime/client closure runs in finally. Domain assertions,
20-round capacity race and CLOSED-fixture scope remain unchanged. No schema,
FK or production validation was weakened to make cleanup pass.

## Environment and commands

All local database checks use the user-approved Docker test database
`127.0.0.1:55433/loungcheu_test` via process-only TEST_DATABASE_URL. Original
legacy data on 5432 and `.env.test` are unchanged. Browser tests use API 3011,
UI 5183, one Chromium worker and synthetic accounts. Temporary migration/restart
databases belong to the guarded existing helper, not application data.

The initial PATH selected **Node 24.15.0**, outside this repository's
`>=22.16.0 <23` engine. Those diagnostics are retained separately: the first
default-pool run in [vitest-worker-exit.log](vitest-worker-exit.log) passed 261
tests but had a native Windows worker exit (3221226505); the second in
[vitest.log](vitest.log) passed 254 and had the same worker-exit code in another
file. Neither is accepted as a complete pass. The identical suite with threads
pool passed [263/263](vitest-threads.log), but that remains an unsupported-runtime
diagnostic, not the required Node 22 acceptance run.

An already-installed **Node 22.23.2** at the local Hermes runtime is selected
for subsequent checks by a child-process-only PATH prefix. No global Node,
repository config, package/lockfile or permanent environment is changed. The
supported-runtime runs use the normal Vitest pool, with logs under `node22/`;
see [runtime record](node22/environment.json). No causal claim is made that
Node 24 alone explains the native worker exits.

Commands from repository root after selecting Node 22 and the approved test URL
(the recorded runner prepends the existing Node 22 directory only for its child
processes):

```powershell
npm.cmd run typecheck
npm.cmd test -- --reporter=dot --maxWorkers=1
npm.cmd run build
npm.cmd run test:built
$env:E2E_WEB_PORT='5183'
$env:E2E_API_PORT='3011'
npm.cmd run test:e2e
```

Results are recorded after each command completes; logs are raw execution
evidence. Build follows the integration suite because restart verification
also compiles the backend. Browser tests follow API/DB integration to avoid
test-account resets colliding between suites.

## Final supported-runtime results

All rows below use **Node 22.23.2**, including the normal Vitest process pool;
they supersede the unsupported-runtime diagnostic attempts above.

| Check | Actual result | Evidence |
|---|---|---|
| Full Vitest regression | **263 PASS, 25 files, 0 FAIL/SKIP, exit 0** | [Vitest](node22/vitest.log) |
| Workspaces and tooling typecheck | PASS, exit 0 | [Typecheck](node22/typecheck.log) |
| Client/server production build | PASS, exit 0 | [Build](node22/build.log) |
| Compiled production route smoke | **4 PASS**, exit 0 | [Smoke](node22/built-smoke.log) |
| Full Chromium suite, including F-06 and F-07 journeys | **39 PASS, 0 FAIL/SKIP**, exit 0 | [Chromium](node22/chromium.log) |
| Read-only temporary database cleanup check | **0 remaining disposable databases** | [Cleanup](node22/cleanup.log) |
| Static merge/content verification | No conflict markers; both methods/routes retained; edit before close; F-07 AC/TEST rows unchanged; valid local document links | [Static verification](static-verification.log) |

The supported-runtime full test log includes actual compiled-backend restart
with PIDs **65480, 7452, 48264**, two stop/restart cycles on the same database,
and the final one Registration/three history rows. F-06's 160 lock races and
F-07's 20 capacity-vs-registration rounds run together in the combined suite.
This is local verification of the resolved working tree, not GitHub CI at a
merge commit or independent acceptance. The previous unsupported Node 24 runs
and the initial fixture cleanup failure are preserved, not relabelled GREEN.

## Remaining work

User resolves Git's index state using git add and creates the merge commit
after verification. Then push feature/47-f06 and open its PR for teammate/CI.
The merge does not automatically close #47 or mark Sprint 2 Done. TEST-44(c)
remains a separate integration PR after both features merge to staging;
teammate TEST-47/52 still uses the documented CLOSED fixture until the agreed
actual-close integration step. CI, independent UAT and accepted release remain
separate from local verification.
