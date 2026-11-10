# Issue #4: own registrations and organizer roster

Participants can open their persisted registration list/detail after reload or re-login. Organizers can open an owned event's roster and refresh participant names and ACTIVE count. Queries enforce session ownership, return only contract fields, and private screens discard data across account changes and access failures.

Implements F-04/F-05, AC-18–23, with three protected GET endpoints. No migration or Sprint2/3 controls. Initial implementation eeafc31 and review fixes RV-01–03 are committed/pushed in **331328812092c04db84859c4ca00e9a6aa70b0fe** on feature/registration-views; remote and PR head verified10November2026.

RV-01 corrects the browser login helper to end an existing server session before navigating to Login. It handles a concurrent completed logout (204/401), verifies anonymous identity, and retains the real wrong-account/wrong-role assertions. RV-02/03 synchronize revision, results, requirement rows and delivery evidence. See [current verification](views-verification.md) and [current revision manifest](evidence/revision-3313288/manifest.json) for exact tested content, results and retained failed attempts.

GitHub verified read-only10November2026: [PR #10](https://github.com/jetanin/LoungCheu/pull/10) OPEN/Draft into sprint-1-staging, head3313288, reviews=[], no merge. [Captured current state](evidence/revision-3313288/github-status.json). Older PR9/Issue4 facts remain in the dated8November snapshot. These facts do not establish teammate approval or release acceptance.

Validation for source3313288: Node22.23.2/PostgreSQL17.11;159 Vitest, focused2/full37 Chromium, typecheck/build and compiled smoke3 PASS, recorded8November and consistent with the supplied follow-up review. The10November update reconciles documents/commands only; it does not claim rerunning those application checks. The original34-file execution manifest was verified before editing documents and remains historical; current hashes are linked above.

Pending: teammate review, staging integration/merge, OS-process restart, independent clean reproduction/UAT and reviewed main release. Automated application recreation and browser tests do not establish these gates or entire Product DoD.
