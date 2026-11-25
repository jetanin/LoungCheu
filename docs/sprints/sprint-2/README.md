# Sprint 2 — F-06 implementation and completion record

**Sprint 2 release — 26 November 2026 (Asia/Bangkok):** F-06 and F-07 are released on `main` as tag `v2.0.0-sprint-2` (`c0faf24`).
- Release PR #67 (`sprint-2-staging` → `main`): authored by jetanin, approved by i3artuf, merged 26 Nov 00:45 with a merge commit.
- CI `test-and-docker` [run 45666007554](https://github.com/jetanin/LoungCheu/actions/runs/45666007554) on release head `0643806` (same tree as `c0faf24`): Vitest 25 files, 264/264 passed; Playwright 39/39 passed; 0 failed, 0 skipped.
- Deploy run 45668146212 (migration `202611240001_registration_lifecycle`, smoke test) → Cloud Run revision `scccd8b05-00011-fvb`; `/api/ready` returned `ready`, `db: connected`, version `c0faf24`.
- The UAT Team was told before the deploy (Lab 6 evidence EV-0-05). No independent UAT of Sprint 2 has run yet.
- The later `v2.0.1-lab6` (`6f49d32`) adds only Lab 6 exercise tests and docs. The Sprint 2 release stays identifiable as `v2.0.0-sprint-2` (`c0faf24`).

The dated text below is kept as history. The "Accepted release" columns now point to this release.

Updated 24 November 2026 (Asia/Bangkok). Issue **#47**, branch
`feature/47-f06`, based on `sprint-2-staging` as supplied by the user.
Contract design Issue #46 is closed according to the user. This record covers
F-06 only; F-07/#48 is owned by the teammate and is not accepted by this record.

**Status: implemented and locally verified; not Done or an accepted release.**
Integration update: the user started `git merge origin/sprint-2-staging` into
`feature/47-f06` after the F-07 review. Conflict resolution and combined runs
are recorded in [staging merge evidence](evidence/f06-staging-merge/README.md).
This imports F-07 implementation; the original F-06-only evidence below keeps
its original source/totals. The user must finish the merge commit after review.
Latest source SHA supplied by the user before this documentation/final-run step:
`ba89488079a2c884735a18642dbd7487b6872559`. The assistant ran no Git commands
and has not independently verified ancestry, remote publication or board state.
Current changes add documentation/evidence, the required `cancelled_at:null`
field to one historical browser-success fixture, and failure-state diagnostics
to the F-06 browser test; application code is unchanged
from that source. These changes must be committed by the user; record that SHA
in the PR. [Contract](contracts.md), [test design](sts.md),
[System SDS](../../system-sds.md), [traceability](../../traceability.md).

## Completion table

PASS below means local executed verification, not CI, peer acceptance or release.
Implementation file paths are repository-relative.

| AC | Implementation / source | Executed verification | Local result / remaining acceptance | Accepted release |
|---|---|---|---|---|
| AC-28 | registrations/cancellation.ts + cancellation-router.ts; queries.ts; RegistrationViews.tsx; API GREEN `0321258`, UI GREEN `5b12163` | TEST-37/40/43: lifecycle API, hardening, UI and real browser cancel/returned-seat flow | PASS: full before cancel, seat available after, same ref/first time, cancellation history/time; reviewed (PR #59), released (PR #67) | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-29 | registrations/service.ts + router.ts; RegistrationAction.tsx; API/UI GREEN above | TEST-38/40/42/43: two cycles, fresh201/reactivate200, capacity/duplicate, same-record DB/UI/history | PASS; browser A→B returned-seat use then A reactivation; reviewed (PR #59), released (PR #67) | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-30 | events/service.ts `close` + appended router block; EventPage.tsx/LifecycleMutation.tsx | TEST-39/40/43 and close races: before/at/after deadline, invalid transitions, preservation, CLOSED UI | PASS for F-06; close→PATCH executed in teammate TEST-47/52 using the real close ([cross-feature evidence](evidence/f07-cross-feature/README.md)) | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-31 | Event→Registration locks; clock after Event lock; EmptyInput/auth pipeline | TEST-40/42: −1/0/+1 ms, precedence/input/spoof/parser budgets and deadline-crossing lock wait | PASS; real PostgreSQL lock queue tests, not timing-only assertions | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-32 | cancellation/events/registration routes; LifecycleMutation, RegistrationViews, RegistrationAction | TEST-41/43: role/ownership/CSRF/Origin/errors; confirmation, busy, 409, access rejection, uncertainty, stale reads, reload/re-login | PASS locally; independent UAT not established | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-33 | lifecycle SQL migration, schema.prisma, seed.ts/demo-data.ts; atomic history writes | TEST-42; TEST-44(a/b); process-restart readback | PASS locally: races/backfill/fresh seed/rollback; TEST-44(c) cancel×capacity edit PASS in `event-edit.test.ts` ([cross-feature evidence](evidence/f07-cross-feature/README.md)); reviewed with CI PASS (PR #60), released (PR #67) | `v2.0.0-sprint-2` (`c0faf24`) |

Server modules above are under `server/src/modules/`; UI files under
`client/src/features/registrations/` or `features/events/`; migration under
`server/prisma/migrations/202611240001_registration_lifecycle/`.

## Executed test design → files and evidence

| Test target | Test files / scope | Evidence |
|---|---|---|
| TEST-37–41 | `server/tests/integration/registration-lifecycle.test.ts`: 9 original domain/access/boundary cases | [API RED](evidence/f06-red/README.md), [API GREEN](evidence/f06-api-green/README.md) |
| TEST-40–42 | `registration-lifecycle-hardening.test.ts`: 21 cases; input/security/precedence; 8 concurrency groups × 20 fresh rounds (160), including close vs create/reactivate/cancel and post-lock deadline | [Hardening](evidence/f06-api-hardening/README.md) |
| TEST-43 component | `RegistrationLifecycle.test.tsx`: 11 original UI cases; `RegistrationLifecycleEdges.test.tsx`: 24 additional cases, existing registration UI regression | [UI RED](evidence/f06-ui-red/README.md), [UI GREEN](evidence/f06-ui-green/README.md), [edge verification](evidence/f06-ui-edges/README.md) |
| TEST-43 browser | `tests/e2e/registration-lifecycle.spec.ts`: real publish/register/cancel/re-login/full/reactivate/roster/close; final DB identity/history assertions | [Chromium journey and screenshots](evidence/f06-browser/README.md) |
| NFR-03 / TEST-43 persistence | `registration-lifecycle-restart.test.ts`: actual compiled server stopped/restarted twice on same DB, 3 distinct PIDs; cancelled then active/CLOSED readback with existing session and fresh logins | [Restart/migration RED](evidence/f06-migration-restart/README.md), [GREEN](evidence/f06-migration-green/README.md) |
| TEST-44(a/b) | `registration-lifecycle-migration.test.ts`: 8 actual CLI/backfill/legacy guard/fresh+repeat+concurrent seed/transaction fault rollback cases | [Migration GREEN](evidence/f06-migration-green/README.md) |
| TEST-44(c) | `server/tests/integration/event-edit.test.ts`: cancel→PATCH capacity↓→reactivate EVENT_FULL (record/history unchanged)→PATCH capacity↑→reactivate same reference | [Cross-feature evidence](evidence/f07-cross-feature/README.md) — PASS locally, integration PR `test/47-sprint-2-cross-feature` |

Integration file paths in abbreviated rows are under `server/tests/integration/`.
Concurrent-failure assertions distinguish the losing operation's effects from a
successful competitor's commit. History fault injection uses test-local DB
triggers; there is no public test/fault/history endpoint.

## Source and TDD ledger

All SHAs are user-supplied. Recorded results in older evidence retain their
original source/run scope; later SHAs do not relabel those runs.

| Step | SHA | Evidence / interpretation |
|---|---|---|
| Starting baseline | `cf0cac948292c36d81cac827b2b77307c8cf10ad` | Before F-06 API RED |
| API domain RED | `33ac9576a980ee72621ab7c472b628774f4f2dc3` | 9 meaningful lifecycle tests fail against missing behaviour |
| API GREEN | `0321258975fba373a92d847ea756f9caf397477f` | Same domain assertions pass; atomic history/schema/API |
| UI RED | `3f21204a936714f8ae33f9b01e344db1e926dcf7` | 9 fail / 2 pass on existing UI components |
| UI GREEN | `5b12163e1f3837c141bb93773fe45e9e44ec3308` | Same 11 UI tests pass |
| API hardening verification | `27a8804a9202f48227b80cd38ca1f4c8d26cff2c` | Coverage addition; 209 full Vitest tests at that step |
| Migration diagnostic RED + restart tests | `65bbadbcdfd0af9c83d274b699d4a0919eebd678` | 8 pass / 1 fail: actual Prisma CLI masks reconciliation explanation; preservation already passes |
| Migration diagnostic GREEN | `8d827dc72f6915b6819519a233b8d2d641ee3c53` | Same 9 pass after read-only guard moves before BEGIN; DDL/backfill still atomic |
| Browser verification | `67efa937a8f1bf38b21c77b2820fcef9ebfd3152` | New journey and selected old browser suite 4/4; coverage addition |
| UI edge verification | `ba89488079a2c884735a18642dbd7487b6872559` | 24 new cases pass existing implementation; registration UI suite 61/61; coverage addition |

Browser-test authoring failures and the UI-test selector typing error are
retained honestly in those evidence folders; they are not counted as product
RED. No code changes were made merely to manufacture a failing TDD step.

## Environment and reproduction

Local tests use the approved **Docker db-test at 127.0.0.1:55433/loungcheu_test**.
Original 5432 data contains legacy CANCELLED data without cancellation time:
it was preserved, not reset, migrated or reconciled in this work. `.env.test`
is unchanged and still requires a process-only URL override for these runs.
Do not run the default local DB setup/migrate against 5432 as a shortcut.

```powershell
# In the repository root, set the approved test-only connection first:
$env:TEST_DATABASE_URL='postgresql://loungcheu:test_only@127.0.0.1:55433/loungcheu_test'
# If the isolated tmpfs test container was recreated, initialize only that DB:
npm.cmd run db:migrate:test
npm.cmd run typecheck
npm.cmd test -- --reporter=dot --maxWorkers=1
npm.cmd run build
npm.cmd run test:built
$env:E2E_WEB_PORT='5183'
$env:E2E_API_PORT='3011'
npm.cmd run test:e2e
```

`test_only` is the committed Docker test-profile credential, not an application
secret. Browser bootstrap resets synthetic test-account passwords and leaves
UI-created records in this disposable DB. Migration/restart helpers create and
drop only their owned random databases, and support ephemeral GitHub Actions
5432 only when both CI=true and GITHUB_ACTIONS=true. That CI path remains
unverified locally. [Final local regression logs](evidence/f06-final/README.md).

## Acceptance and integration remaining

| Gate | State |
|---|---|
| Contract/test design before implementation | #46 closed per user; v0.2–0.5 history retained; v0.6 reconciles execution without AC/TEST changes |
| Local F-06 implementation and verification | Recorded above; final totals/evidence in final-run folder |
| Intermittent browser timeout | One full run timed out on B's disabled register action. Three targeted repetitions and the final full 38-test run passed without application changes; root cause not established, retained for review in final evidence |
| PR, labels `documentation` where appropriate / `sprint-2`, assignee, CI `test-and-docker`, substantive teammate review | Not verified/completed by this local step; use actual #47 implementation PR metadata |
| Kanban Specified → Started → PR Review → Done | User/team manages; no board change or Done claim made here |
| Merge | User started merge of origin/sprint-2-staging; conflicts resolved and combined verification recorded separately. Merge commit still user-managed; no force push. F-06 PR review/merge into staging remains pending. **Update 26 Nov:** PR #59 reviewed and merged (`24ebf07`), then released in PR #67 |
| TEST-44(c) | Done locally on `test/47-sprint-2-cross-feature` (agreed with M1; written by M2); PASS, see [cross-feature evidence](evidence/f07-cross-feature/README.md). PR review/CI pending before AC-33/Sprint 2 DoD can be claimed. **Update 25 Nov 2026:** PR #60 reviewed (jetanin), CI SUCCESS, merged `128c35c` |
| TEST-47 | Done locally on `test/47-sprint-2-cross-feature`: TEST-47 (API) and TEST-52 (UI) close through actual F-06 before PATCH/edit; PASS, see [cross-feature evidence](evidence/f07-cross-feature/README.md). PR review/CI pending. **Update 25 Nov 2026:** PR #60 reviewed (jetanin), CI SUCCESS, merged `128c35c` |
| NFR-03 broader acceptance | Actual backend process restart proven; deployment/redeploy and independent clean reproduction not established by this run |
| Independent UAT / #44 partner findings | No new acceptance claimed; team triage deadline 25 November 2026 20:00 Asia/Bangkok per user |
| Release | **Done 26 Nov 2026:** release PR #67 → `v2.0.0-sprint-2` (`c0faf24`), CI run 45666007554, deploy run 45668146212, revision `scccd8b05-00011-fvb`, `/api/ready` = `c0faf24` (was pending in the 24 Nov record) |

## F-07 completion record

Added 25 November 2026 (Asia/Bangkok). Issue **#48**, owner M2. The F-06
record above is unchanged. [Contract](contracts.md) AC-34–40,
[test design](sts.md) TEST-45–52 (STS v0.8).

**Status: implemented, reviewed, merged into `sprint-2-staging` with CI
passing; released to `main` as `v2.0.0-sprint-2` (`c0faf24`) on 26 Nov 2026 (PR #67).**

| AC | Implementation / source | Executed verification | Result | Accepted release |
|---|---|---|---|---|
| AC-34 | `server/src/modules/events/service.ts` (update), `router.ts` (PATCH), `input.ts` (EventPatch) | TEST-45: DRAFT patch of all 7 fields, own GET readback | PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-35 | same; PUBLISHED editable-field check | TEST-46 (a)–(f): content/capacity edits, time fields → 409 FIELD_NOT_EDITABLE, data unchanged | PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-36 | same; CLOSED → EVENT_NOT_EDITABLE | TEST-47: event closed by the real F-06 close endpoint, then PATCH → 409, data unchanged | PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-37 | `input.ts` strict EventPatch parser | TEST-48 unit (`event-patch.test.ts`) + API/DB: empty/type/null/length/capacity/time format/system and unknown fields, DRAFT order → 400 | PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-38 | `service.ts` capacity check after Event lock | TEST-49: capacity = ACTIVE OK, ACTIVE−1 → 409 CAPACITY_BELOW_ACTIVE, raise capacity then new registration OK | PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-39 | Event row lock shared with registration | TEST-50: capacity decrease × last-seat registration, separate connections, lock wait observed in `pg_stat_activity`, 20 rounds; ACTIVE ≤ capacity every round | PASS | `v2.0.0-sprint-2` (`c0faf24`) |
| AC-40 | `router.ts` auth/role/CSRF pipeline; `client/src/features/events/EventForm.tsx`, `EventPage.tsx`, `model.ts`, `lib/api.ts`, `app/App.tsx` | TEST-51 API access matrix; TEST-52 component (`EventEdit.test.tsx`) + Chromium (`tests/e2e/event-edit.spec.ts`) | PASS | `v2.0.0-sprint-2` (`c0faf24`) |

| Step | Commit / evidence |
|---|---|
| STS revised before coding | `31bb715` (STS v0.6) |
| API RED → GREEN | `ef94a3f` failing tests → `78efae7` implementation ([logs](evidence/f07-red/README.md)) |
| UI RED → GREEN | `1fd71db` failing tests → `086f149` implementation ([logs](evidence/f07-red/README.md)) |
| Review fix (form refresh, save 404) | `7c79d95` test → `9eb9afb` fix |
| PR #57 → `sprint-2-staging` | head `9eb9afb`, approved by jetanin, CI `test-and-docker` SUCCESS ([run 45347142610](https://github.com/jetanin/LoungCheu/actions/runs/45347142610)), merged `582a60d` on 24 Nov 2026 |
| PR #60 cross-feature (TEST-47/52 via F-06 close, TEST-44(c)) | head `2e6ddc2`, approved by jetanin, CI SUCCESS ([run 45380720656](https://github.com/jetanin/LoungCheu/actions/runs/45380720656): Vitest 264/264, Playwright 39/39), merged `128c35c`; local logs in [cross-feature evidence](evidence/f07-cross-feature/README.md) |
| Sprint 2 release to `main`, deploy, tag | Release PR #67 merged `c0faf24` (26 Nov 2026), CI [run 45666007554](https://github.com/jetanin/LoungCheu/actions/runs/45666007554) Vitest 264/264 + Playwright 39/39, deploy run 45668146212 → `scccd8b05-00011-fvb`, tag `v2.0.0-sprint-2` |

F-07 test counts in CI (from the job logs; 0 failed / 0 skipped in both runs):

| Command (CI `test-and-docker`) | Run 45347142610 @ `9eb9afb` | Run 45380720656 @ `2e6ddc2` |
|---|---|---|
| Vitest `server/tests/integration/event-edit.test.ts` (TEST-45–51; + TEST-44(c) in #60) | 7 passed | 8 passed |
| Vitest `server/tests/unit/event-patch.test.ts` (TEST-48 unit) | 4 passed | 4 passed |
| Vitest `client/src/features/events/EventEdit.test.tsx` (TEST-52 component) | 10 passed | 10 passed |
| Vitest full suite (includes Sprint 1 regression) | 19 files, 189 passed | 25 files, 264 passed |
| Playwright Chromium full suite (includes TEST-52 `event-edit.spec.ts`) | 38 passed | 39 passed |

**TDD RED/GREEN output:** no failing output was saved when the RED commits
were made (CI ran only on `ac28a9d` and `9eb9afb`). On 25 Nov 2026 the four
commits were re-run unchanged and the logs retained: API `ef94a3f` 11 failed →
`78efae7` 11 passed; UI `1fd71db` 7 failed / 1 passed → `086f149` 8 passed.
All RED failures are assertion failures. See
[F-07 RED/GREEN evidence](evidence/f07-red/README.md).

AI assistance: Codex implemented/tested and reconciled documentation/evidence
as recorded here. The user runs Git; the human teammate reviews/accepts. Local
AI-run checks are not independent UAT or teammate approval.
