# R-10: Lab 5 labels and retained history

Audit date: 15 November 2026 (Asia/Bangkok). Source: the public [Issues](https://github.com/jetanin/LoungCheu/issues), [Pull Requests](https://github.com/jetanin/LoungCheu/pulls), [Labels](https://github.com/jetanin/LoungCheu/labels) and [Actions](https://github.com/jetanin/LoungCheu/actions) pages. This is an audit of current GitHub metadata, not proof that R-10 has already passed.

The initial audit found no `lab5` label defined in the repository, no Lab 5 Issue or PR carrying that label, and zero workflow runs. A follow-up check on 16 November 2026 (Asia/Bangkok) of the public GitHub metadata verified `lab5` on every item in the table below. Existing Issues, PRs, reviews and commits remain available through their links. CI run history cannot be created retroactively; retain real runs after Issue #16's workflow is pushed.

| Item | Lab 5 work | At audit | Verified after correction |
| --- | --- | --- | --- |
| [Issue #13](https://github.com/jetanin/LoungCheu/issues/13) | GCP access/project | Missing | Verified |
| [Issue #14](https://github.com/jetanin/LoungCheu/issues/14) | Cloud-ready app | Missing | Verified |
| [Issue #15](https://github.com/jetanin/LoungCheu/issues/15) | Docker | Missing | Verified |
| [Issue #16](https://github.com/jetanin/LoungCheu/issues/16) | PR CI | Missing | Verified |
| [Issue #17](https://github.com/jetanin/LoungCheu/issues/17) | First GCP deployment | Missing | Verified |
| [Issue #18](https://github.com/jetanin/LoungCheu/issues/18) | GitHub/GCP connection and merge gate | Missing | Verified |
| [Issue #19](https://github.com/jetanin/LoungCheu/issues/19) | Repeatable deployment pipeline | Missing | Verified |
| [Issue #20](https://github.com/jetanin/LoungCheu/issues/20) | Persistence/submission evidence | Missing | Verified |
| [PR #21](https://github.com/jetanin/LoungCheu/pull/21) | Issue #14 into `lab5-staging` | Missing | Verified |
| [PR #22](https://github.com/jetanin/LoungCheu/pull/22) | Issue #15 into `lab5-staging` | Missing | Verified |

Existing work history is preserved: PR #21 has [source `175b94b`](https://github.com/jetanin/LoungCheu/commit/175b94b2388305943de9b6906cdcc2bf0e4af49d), [teammate approval](https://github.com/jetanin/LoungCheu/pull/21#pullrequestreview-5910860673) and [staging merge `b30f9d6`](https://github.com/jetanin/LoungCheu/commit/b30f9d688b7f9730ac09885f5663b940bd9ba35f). PR #22 has [source `051c718`](https://github.com/jetanin/LoungCheu/commit/051c71843a2503945f79174cb786e47972d363e2), [teammate approval](https://github.com/jetanin/LoungCheu/pull/22#pullrequestreview-5911171571) and [staging merge `6f82566`](https://github.com/jetanin/LoungCheu/commit/6f825660aae0ac71cf729b22f0597ede926971fa). Preserve the [existing contract file and its Git history](https://github.com/jetanin/LoungCheu/commits/lab5-staging/docs/sprints/sprint-1/contracts.md) as well.

## Finish and verify

1. Add `lab5` to the Issue and PR for every later Lab 5 change, including PR #16 once opened and the release PR into `main`. Check both open and closed items when auditing; do not rely on title text alone.
2. Keep the actual commit, PR, review and Actions run links in the final evidence index. Do not delete or rewrite history to hide a failed run. Keep the CI check enabled and required after Lab 5; capture the ruleset and run history when Episodes 4 and 6 are complete.

The retrospective label work is **verified**. R-10 as a whole remains **open** until CI run history and continued enforcement exist. The project board and teammate review requirements are tracked separately under R-09.
