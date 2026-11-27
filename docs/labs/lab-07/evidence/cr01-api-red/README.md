# CR-01 API RED evidence - Lab 7 / #85

Owner: Jetanin Naitho (`jetanin`). Automated commands were executed through Codex
in Jetanin's workspace; this is developer verification, not independent UAT.

## Version and sequence

- Reviewed contract: [PR #100](https://github.com/jetanin/LoungCheu/pull/100),
  reviewed head `634eda9a914905a17a6bcd6267b60950416c2450`.
- Contract merge / actual pre-change implementation:
  `079397267e354e4c9dd8034d5652cf191fd49361`.
- Working branch: `feature/85-lab7-title-validation`.
- Scope: BR-01, AC-07 / TEST-08 (create), AC-37 / TEST-48 (PATCH).
- These runs use the pre-change implementation plus a test-only working-tree
  addition, subsequently committed separately as RED test commit
  `4ab6ccf816e002167350594f19eb26aef889ad45` (SHA supplied by Jetanin).
  No GREEN implementation is included in that RED commit.
- The accepted Sprint 1 reference is `v1.0.1-uat` /
  `0b2cc804f298a28041d9ba9c7ec05d2cf64e4e08`. The actual implementation under
  maintenance includes later-sprint development, notably F-07 PATCH and F-08/F-09.

## Environment and execution

Docker PostgreSQL test instance `loungcheu-db-test-1`, published only on
`127.0.0.1:55433`, database `loungcheu_test`. The existing application/test data on
port 5432 was not used. The test connection was checked against
`current_database()` before execution; all four existing project migrations,
including `202611270001_registration_attendance`, were already applied.
Synthetic suite-owned events/registrations/history are removed after execution,
including unexpected successful writes made by the old code during RED. Test
account fixtures use a random runtime password which is not retained here.

Logs record Node version, exact command, UTC start/end and exit status.
For local Bangkok time use UTC+07:00. `TEST_DATABASE_URL` / `DATABASE_URL` were
overridden for the process only; credential values are omitted from evidence.

| Evidence ID | Execution | Actual result | Evidence |
|---|---|---|---|
| EV-L7-B-01 | Existing events, event-edit and EventPatch suites on pre-change implementation | 3 files, 30 passed, 0 failed, 0 skipped; exit 0 | [baseline.log](baseline.log) |
| EV-L7-B-02 | Server TypeScript check with new tests | PASS; exit 0 | [typecheck.log](typecheck.log) |
| EV-L7-B-03 | New CR-01 API tests against old implementation | 1 file, 20 failed, 16 passed, 0 skipped (36 total); exit 1 (expected RED) | [red.log](red.log) |
| EV-L7-B-04 | Source manifest comparison | Server source, Prisma schema/migrations and client source unchanged during and between baseline/RED | [baseline audit](baseline-source-audit.json), [RED audit](red-source-audit.json) |

## Why the failures are meaningful

The new file is
`server/tests/integration/event-title-maintenance.test.ts`. It uses real HTTP
handlers with authenticated sessions and a real PostgreSQL database, without
mocking the validation/service result.

- Eight cases fail because one/two-code-point titles (`a`, `ab`, padded `ab`,
  two emoji) are accepted by old code: create returns 201 and inserts a row;
  PATCH returns 200 and changes the event. The new contract requires 400 with
  no insert or partial update.
- Twelve cases already return 400 for empty/whitespace/overlong/wrong-type titles,
  but still return the old `1–120` title message. The revised contract requires
  `fields.title = ["กรุณากรอก 3–120 ตัวอักษร"]` for both create and PATCH.
- Sixteen preserved cases pass: valid three/120-code-point inputs and normalized
  readback for both endpoints (12 cases); legacy short-title DRAFT/PUBLISHED
  read/omitted-title PATCH (2); legacy publish/registration (1); and unchanged
  auth/role/CSRF/ownership precedence (1).

This is requirement-change RED, not a defect in the formerly correct 1–120 rule.
There is no compile/setup failure. Existing regression files and production code
were not modified to produce the failures. Legacy fixture insertion is explicitly
used to represent records created before CR-01.

## Next step and limits

Commit the tests and this evidence separately before changing implementation.
Then implement the title-only minimum and run these same assertions for GREEN,
plus the relevant existing regression. In the GREEN change, retain the intent of
existing unknown-field tests by using a valid >=3-character title, and update
only title-message expectations that legitimately change under CR-01 (see #84).

This focused baseline is not the full project regression. Client Component/E2E
work belongs to #86; integration/release/deployed verification belongs to #87.
No claim is made here that CR-01 is implemented, released, or independently
accepted. No Git commands, commits, pushes, or PR creation were performed by
Codex during this step.
