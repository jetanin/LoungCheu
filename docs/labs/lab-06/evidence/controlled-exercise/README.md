# Lab 6 controlled exercise — fixed release evidence

Recorded 26 November 2026 (Asia/Bangkok). This record identifies the corrected
deployment and the subsequent independent retest. Nantakorn (TH-005_P5) reports
PASS and confirms Sprint 1 remains Accepted on this revision. The evidence
distinguishes results visible in screenshots from Nantakorn's result message
posted directly in the IG group CPE334_Lab.

| Item | Verified value |
|---|---|
| Release PR | [#68](https://github.com/jetanin/LoungCheu/pull/68) |
| Full release SHA | `6f49d327e8e709fc716b9eeb60591ea4fd692fc9` |
| Tag | [`v2.0.1-lab6`](https://github.com/jetanin/LoungCheu/releases/tag/v2.0.1-lab6) |
| Tag verification | Annotated tag object `deeeca5127aedb4c634df9393324e866a842d242` points to the full release SHA above; checked through the GitHub API |
| Deploy run | [45685620954](https://github.com/jetanin/LoungCheu/actions/runs/45685620954), SUCCESS on the full release SHA above |
| Cloud Run revision | `scccd8b05-00012-msg`, from the retained deploy summary |
| Regression in screenshot | Vitest 25 files / 265 tests passed |
| Pipeline smoke | Summary reports health, DB readiness, release SHA, SPA and anonymous-access checks passed |
| Public readiness | Jetanin Naitho (เจตนินทร์ นายโท, TH-001_P3) ran `curl.exe -i`: HTTP 200; `data.status=ready`; `data.db=connected`; `data.version` equals the full release SHA |
| Readiness response time | `Thu, 26 Nov 2026 04:04:31 GMT` = 26 Nov 2026 11:04:31 Asia/Bangkok |

## Screenshots

| Evidence | File |
|---|---|
| CX-E07: deploy summary and read-only smoke | [05-fixed-deploy-summary.png](05-fixed-deploy-summary.png) |
| CX-E08: public readiness | [06-fixed-readiness.png](06-fixed-readiness.png) |
| CX-E09: fetched release tag | [07-fixed-release-tag.png](07-fixed-release-tag.png) |
| CX-E10: retest C1 public event / seats | [08-retest-event-seats.jpg](08-retest-event-seats.jpg) |
| CX-E11: retest C2 own registration | [09-retest-own-registration.jpg](09-retest-own-registration.jpg) |
| CX-E12: retest C3 organizer roster | [10-retest-organizer-roster.jpg](10-retest-organizer-roster.jpg) |
| CX-E13: retest B1–B5 API console | [11-retest-api-console.jpg](11-retest-api-console.jpg) |
| EV-D-03 / CX-E14: Nantakorn's result message posted directly in IG CPE334_Lab | [12-partner-retest-report.txt](12-partner-retest-report.txt) (text transcription; original chat screenshot: EV-D-03) |
| EV-D-04: IG message carrying images 08–11 | CPE334_Lab, 26 Nov 2026 20:48 Asia/Bangkok; source message for the four retest JPEGs above |

The tag screenshot records Jetanin Naitho fetching the tag from origin. Its target
was checked separately through the GitHub API; it is not inferred from the
tag name or the fetch output alone. The response header supplies the readiness
timestamp; screenshot filesystem timestamps are not treated as execution times.

## Handoff and remaining work

- [Retest instructions](../../retest-controlled-exercise.md) now identify the
  tag, full SHA, revision and deploy run.
- [Defect report and version table](../../controlled-exercise.md) retain the
  historical RED/GREEN results and add this release as a separate checkpoint.
- Pre-deploy notification was sent in the IG group on 26 Nov 2026 at 00:34
  Asia/Bangkok (EV-0-05). The independent retest request was sent on 26 Nov 2026
  at 02:38 Asia/Bangkok (EV-D-02) for `v2.0.1-lab6` / `6f49d32`.
- Nantakorn / TH-005_P5 ran the retest on 26 Nov 2026, 19:56–20:28
  Asia/Bangkok. B1–B5 and C1–C3 pass in the supplied screenshots. Nantakorn's
  result message posted directly in IG CPE334_Lab (EV-D-03) also reports every
  UAT-02 step PASS and confirms Sprint 1
  remains Accepted. See [retest results](retest-results.md) for actuals, source
  attribution and evidence limits, and [image provenance](retest-image-map.csv).
- UAT-02 is supported by Nantakorn's result message (EV-D-03), rather than
  separate step screenshots in images 08–11. EV-D-04 records the screenshot
  delivery at 20:48 Asia/Bangkok. The text transcription remains separate from
  the original IG evidence. Review the full Issue #64/#44 checklist before
  closing either issue; no issue or board state is changed by this documentation
  update.
- This Lab 6 release is separate from Sprint 2 release
  `v2.0.0-sprint-2` / `c0faf24`. Earlier Sprint 2 screenshots retain their
  original release identity.
