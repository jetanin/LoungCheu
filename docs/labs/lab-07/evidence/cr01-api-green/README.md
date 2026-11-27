# CR-01 API GREEN evidence - Lab 7 / #85

Owner: Jetanin Naitho (`jetanin`). Automated verification was executed through
Codex in Jetanin's workspace; it is not independent UAT.

## Version chain

| Step | Version |
|---|---|
| Reviewed CR-01 contract | PR #100, head `634eda9a914905a17a6bcd6267b60950416c2450` |
| Actual pre-change implementation / contract merge | `079397267e354e4c9dd8034d5652cf191fd49361` |
| Separate test-only RED commit | `4ab6ccf816e002167350594f19eb26aef889ad45` |
| This GREEN verification | RED commit plus working-tree server implementation and justified existing-test updates; record GREEN commit SHA after committing |

[RED evidence](../cr01-api-red/README.md): the same 36 assertions produced
20 failures and 16 passes against the old rule. The test file's SHA-256 is
`852c8ff3776831cec3aa68fe536243a733932559d25f99fdc9d86bf947306d0a`;
the GREEN run must retain that exact file. This prevents changing the assertions
to obtain a passing result.

## Implementation and preserved behavior

The production change is confined to `server/src/modules/events/input.ts`:
per-field text validation now uses a minimum of 3 for `title` and 1 for
`description` / `location`. Both create and PATCH retain code-point counting
after trim, upper bounds, strict types, unsupported-text rejection and existing
auth/role/CSRF/ownership rules. PATCH still validates only supplied fields.
No database migration or retrospective data rewrite is needed.

Two existing regression fixtures use `title: 'okay'` instead of `title: 'ok'`
in unknown/system-field rejection cases. This keeps title valid under the new
rule, so those tests continue exercising their intended unknown-field rejection.
The old EventPatch title-message expectation changes from `1–120` to `3–120`
because that is the reviewed requirement change; unrelated messages/assertions
remain in place.

## Execution evidence

Target: the existing Docker test instance on `127.0.0.1:55433`, database
`loungcheu_test`, verified before execution. Process-only database overrides are
used; credentials are omitted from logs. Start/end timestamps are UTC; Bangkok
time is UTC+07:00. Exact commands and exit statuses are retained in each log.

| Check | Actual result |
|---|---|
| Same CR-01 assertions as RED | 36 passed, 0 failed, 0 skipped |
| Full Vitest regression | 38 files, 417 passed, 0 failed, 0 skipped |
| Typecheck (server/client/tools) | All three exit 0 |
| Production build (client/server) | Both exit 0 |
| Compiled production smoke | 4 passed, exit 0 |

- EV-L7-B-05: [green.log](green.log) - all 36 CR-01 API tests pass, including
  no-write rejection, Unicode 2/3 and 120/121 boundaries, trimmed readback,
  legacy DRAFT/PUBLISHED omitted-title PATCH, legacy publish/registration, and
  auth/role/CSRF/ownership regression.
- EV-L7-B-06: [typecheck.log](typecheck.log),
  [client-typecheck.log](client-typecheck.log),
  [tools-typecheck.log](tools-typecheck.log) - TypeScript checks.
- EV-L7-B-07: [regression.log](regression.log) - complete Vitest regression,
  including existing API/DB/unit and client Component tests. See actual summary
  for counts; these are developer tests, not independent acceptance.
- EV-L7-B-08: [client-build.log](client-build.log),
  [server-build.log](server-build.log),
  [compiled-smoke.log](compiled-smoke.log) - production builds and compiled-app
  smoke covering SPA, DB health/version, readiness and unknown API JSON 404.
- EV-L7-B-09: [source-audit.json](source-audit.json) - same RED assertions,
  implementation source unchanged during verification, and client source /
  Prisma schema and migrations unchanged from RED.

## Scope limits and handoff

The UI's new minimum and legacy-title form behavior belong to #86; the client
source is intentionally unchanged in this API step. Existing client tests in
the Vitest regression do not prove the new CR-01 UI contract. New Component/E2E
verification, combined API/UI integration, review/CI, release, deployed checks
and independent acceptance must be recorded separately under #86/#87.
Browser E2E was not rerun in this API preparation step; no new browser PASS is
claimed by the Vitest results above. The PR's required CI and later integrated
CR-01 API/UI checks must be reviewed on their actual tested heads.

The local run does not deploy or claim CR-01 is released. No Git commands,
commits, pushes or PR creation were performed by Codex during GREEN preparation.
