# Issue #4: own registrations and organizer roster

Participants can open their persisted registration list/detail after reload or re-login. Organizers can open an owned event's roster and refresh participant names and ACTIVE count. Queries enforce session ownership, return only contract fields, and private screens discard data across account changes and access failures.

Implements F-04/F-05, AC-18–23, with three protected GET endpoints. No migration or Sprint2/3 controls. Initial implementation eeafc31 and review fixes RV-01–03 are committed/pushed in **331328812092c04db84859c4ca00e9a6aa70b0fe** on feature/registration-views; remote and PR head verified10November2026.

RV-01 corrects the browser login helper to end an existing server session before navigating to Login. It handles a concurrent completed logout (204/401), verifies anonymous identity, and retains the real wrong-account/wrong-role assertions. RV-02/03 synchronize revision, results, requirement rows and delivery evidence. See [current verification](views-verification.md) and [current revision manifest](evidence/revision-3313288/manifest.json) for exact tested content, results and retained failed attempts.

Later evidence: PR #10 was approved by i3artuf at0bd3468 on10 November2026 16:25:38 Asia/Bangkok and merged into sprint-1-staging at97a5b91 at16:26:11. [12 November snapshots/review details](../deliverable-1/evidence/review-merge-20261112/README.md). The [earlier10 November capture](evidence/revision-3313288/github-status.json) and older PR9/Issue4 facts are historical. The PR body predates approval/merge; its pending/draft wording does not override the later structured review/merge fields. Main release acceptance remains unverified.

Validation for source3313288: Node22.23.2/PostgreSQL17.11;159 Vitest, focused2/full37 Chromium, typecheck/build and compiled smoke3 PASS, recorded8November and consistent with the supplied follow-up review. The10November update reconciles documents/commands only; it does not claim rerunning those application checks. The original34-file execution manifest was verified before editing documents and remains historical; current hashes are linked above.

Pending: OS-process restart, independent clean reproduction/UAT, final board evidence and reviewed main release. PR #7/#10 teammate reviews and staging merges are evidenced. The159/37 results remain tied to3313288, not a new run at0bd3468 or97a5b91. GAP-02 remains OPEN; automated app recreation/browser journeys do not establish entire Product DoD.
