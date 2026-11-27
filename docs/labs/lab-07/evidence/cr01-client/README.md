# CR-01 client validation (Issue #86)

Contract: reviewed PR #100 / Issue #84. API dependency: PR #101 / Issue #85, merged into `sprint-3-staging` as `11325474dd2b20512f0fe846ec7e85a0ca2d8a77`.

## RED — 28 Nov 2026, 01:57 ICT

- Operator: Codex in Paphangkorn's local workspace.
- Old client implementation: `11325474dd2b20512f0fe846ec7e85a0ca2d8a77`. Only client test files were edited for this run; no client implementation change was present.
- Command: `npx vitest run client/src/features/events/model.test.ts client/src/features/events/EventEdit.test.tsx client/src/features/events/EventForm.test.tsx -t CR-01`
- Actual result: **11 failed, 6 passed, 19 skipped** in 3 test files (filter excludes unrelated cases). See [complete output](red-vitest.log).
- Missing behavior: old client accepts `a`, `ab`, trimmed `ab`, and two emoji as event titles; create/edit components do not show the new `3–120` field error. The 121-code-point case rejects the value but still uses the old `1–120` message. The six passes are the five valid boundary examples and the preserved legacy-title edit case.
- These failures are assertion failures on the old client behavior. The API change was already integrated; this run isolates the client behavior with component fetch mocks.

The RED test commit and subsequent GREEN implementation commit must be recorded separately. Add their SHAs and the GREEN/regression results after execution.
