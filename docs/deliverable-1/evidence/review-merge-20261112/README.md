# PR review and staging merge evidence

Reconciled 14 November 2026 (Asia/Bangkok) from local GitHub JSON snapshots retained by the Part F capture of 12 November. This pass did not query live GitHub or run application tests. Original dated snapshots and test logs remain unchanged.

| PR | Reviewer / approved source | Approval (Asia/Bangkok) | Staging merge (Asia/Bangkok) / commit |
|---|---|---|---|
| [#7](https://github.com/jetanin/LoungCheu/pull/7) | i3artuf / 9f8c4e3a8d5bf881df0672ef36757890da8c0e6f | 6 Nov 2026 22:02:53 | 6 Nov 2026 22:03:06 / ada659b0c6889e22e2d4ae8cc84ceb076d4da97e |
| [#10](https://github.com/jetanin/LoungCheu/pull/10) | i3artuf / 0bd3468f31a9637feab5b9a9d102c22d5eede3d1 | 10 Nov 2026 16:25:38 | 10 Nov 2026 16:26:11 / 97a5b9173ec6b0a53a7759f683b440ec49eae396 |

[PR #7 JSON](pr-7.json) records review of authentication, deadline, duplicate/capacity/concurrency and UI error handling. [PR #10 JSON](pr-10.json) records review of server ownership/minimal fields, roster snapshot/role guards and session invalidation in browser tests; reviewer reports unit/integration and browser journeys passing. The PR #10 body contains older pending/draft wording; use the reviews, approved commit, mergedAt and mergeCommit fields for the captured workflow state.

The 159 Vitest / 37 Chromium / typecheck / build / compiled smoke 3 results are the recorded 8 November execution for application/test source committed as 331328812092c04db84859c4ca00e9a6aa70b0fe. They are not a new run at the reviewed head or staging merge. No approved main release, final board state, OS-process restart, independent clean reproduction or independent UAT is established by these JSON files. GAP-02 remains OPEN; DOD-05 and overall Product DoD remain incomplete. DOD-07 is PARTIAL: feature reviews/staging merges evidenced, release acceptance pending.
