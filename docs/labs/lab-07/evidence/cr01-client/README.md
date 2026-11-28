# CR-01 client validation (Issue #86)

Contract: reviewed PR #100 / Issue #84. API dependency: PR #101 / Issue #85, merged into `sprint-3-staging` as `11325474dd2b20512f0fe846ec7e85a0ca2d8a77`.

## RED — 28 Nov 2026, 01:57 ICT

- Operator: Codex in Paphangkorn's local workspace.
- Old client implementation: `11325474dd2b20512f0fe846ec7e85a0ca2d8a77`. Only client test files were edited for this run; no client implementation change was present.
- Command: `npx vitest run client/src/features/events/model.test.ts client/src/features/events/EventEdit.test.tsx client/src/features/events/EventForm.test.tsx -t CR-01`
- Actual result: **11 failed, 6 passed, 19 skipped** in 3 test files (filter excludes unrelated cases). See [complete output](red-vitest.log).
- Missing behavior: old client accepts `a`, `ab`, trimmed `ab`, and two emoji as event titles; create/edit components do not show the new `3–120` field error. The 121-code-point case rejects the value but still uses the old `1–120` message. The six passes are the five valid boundary examples and the preserved legacy-title edit case.
- These failures are assertion failures on the old client behavior. The API change was already integrated; this run isolates the client behavior with component fetch mocks.

RED test commit: `36f049b` (tests and RED log only). GREEN implementation commit: `596c53b` (client code, revised expectations and browser regression). The RED tests were not weakened between these commits.

## GREEN and regression — 28 Nov 2026, 04:49–04:52 ICT

Operator: Codex in Paphangkorn's local workspace. Tested committed source: `596c53b`. All listed commands ran after that commit, with no application or test source edits between runs.

| Scope | Command | Actual result | Evidence |
|---|---|---|---|
| CR-01 and existing event client unit/component tests | `node node_modules/vitest/vitest.mjs run client/src/features/events` | 3 files, **36 passed, 0 failed, 0 skipped** | [green-vitest.log](green-vitest.log) |
| Server/client TypeScript | `npm run typecheck` | exit 0 | [typecheck.log](typecheck.log) |
| Real browser create/edit/read/access, including CR-01 | `npx playwright test tests/e2e/events.spec.ts tests/e2e/event-edit.spec.ts` | **8 passed, 0 failed, 0 skipped** | [e2e-events-edit.log](e2e-events-edit.log) |
| Existing visual regression at 1280/390/320 px | `npx playwright test tests/e2e/visual-consistency.spec.ts` | **3 passed, 0 failed, 0 skipped** | [e2e-visual.log](e2e-visual.log) |

The new browser test confirms that `ab` and two emoji show the title error without POST/PATCH, three emoji create a DRAFT, a three-code-point Thai title is saved by PATCH and survives reload/publish, a Participant can read the published event, and a Participant cannot open its organizer edit form. The component test also confirms that a legacy title `ab` remains readable and changing capacity sends PATCH without `title`.

Client validation uses code-point counting after trim. The form has `noValidate` and does not set HTML `minlength`/`maxlength` on title because browser length constraints count UTF-16 units and would disagree for emoji; API validation remains authoritative.

The first local typecheck attempt used an old generated Prisma client and failed on `checkedInAt`; `npm run db:generate` refreshed it, then the recorded typecheck passed. The first browser attempt could not start the local server in the sandbox (`uv_os_get_passwd`); the recorded browser runs completed in the permitted local environment. No test was disabled or skipped in the GREEN/regression runs.

## TEST-52 legacy DB follow-up — 28 Nov 2026, 14:28–15:07 ICT

Review found that the legacy-title component test used mocked HTTP. Commit `076fc1c` adds a real browser/API/DB case without changing application code. The test checks the disposable database name `loungcheu_test`, inserts a synthetic DRAFT event with title `ab` directly into that DB, opens the real edit form as its owner, changes capacity 3→4, asserts the actual PATCH body is exactly `{capacity:4}` and HTTP status is 200, then reloads and verifies the real GET and stored DB row still have title `ab` and capacity 4. The fixture is removed in `finally`.

| Scope | Command | Actual result | Evidence |
|---|---|---|---|
| Browser create/edit regression including legacy DB TEST-52 | `npx playwright test tests/e2e/events.spec.ts tests/e2e/event-edit.spec.ts` | **9 passed, 0 failed, 0 skipped** | [e2e-legacy-followup.log](e2e-legacy-followup.log) |
| Server/client TypeScript | `npm run typecheck` | exit 0 | [typecheck-followup.log](typecheck-followup.log) |
