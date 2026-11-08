# Issue #4: own registrations and organizer roster

Participants can open their persisted registration list/detail after reload or re-login. Organizers can open an owned event's roster and refresh participant names and ACTIVE count. Queries enforce session ownership, return only contract fields, and private screens discard data across account changes and access failures.

Implements F-04/F-05, AC-18–23, with three protected GET endpoints. No migration or Sprint2/3 controls. Implementation was committed as eeafc313220fa9feda633b89cab8c4b90cb86f9e on feature/registration-views. This pass's RV-01–03 fixes are an uncommitted patch on that revision.

RV-01 corrects the browser login helper to end an existing server session before navigating to Login. It handles a concurrent completed logout (204/401), verifies anonymous identity, and retains the real wrong-account/wrong-role assertions. RV-02/03 synchronize revision, results, requirement rows and delivery evidence. See [current verification](views-verification.md) and [source manifest](evidence/review-fixes/manifest.json) for exact tested content, results and retained failed attempts.

GitHub verified read-only on 8 November 2026: [PR #10](https://github.com/jetanin/LoungCheu/pull/10) is OPEN/Draft into sprint-1-staging, head eeafc31, with no reviews or merge. [PR #9](https://github.com/jetanin/LoungCheu/pull/9), formerly targeting events, is CLOSED without merge. [Issue #4](https://github.com/jetanin/LoungCheu/issues/4) is OPEN. These are captured facts, not teammate approval. This correction pass has not committed/pushed changes or modified a PR.

Validation on the eeafc31 + RV-01 working-tree patch: Node22.23.2/PostgreSQL17.11; full Vitest159 PASS, focused browser2 PASS, full Chromium37 PASS, typecheck/build PASS and compiled smoke3 PASS. Logs and exact source hashes are linked above.

Pending: teammate review, staging integration/merge, OS-process restart, independent clean reproduction/UAT and reviewed main release. Automated application recreation and browser tests do not establish these gates or entire Product DoD.
