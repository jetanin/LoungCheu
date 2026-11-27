# Sprint 3 release v3.0.0-sprint-3 — post-deploy check, 27 November 2026

Issue #51 (D2). Run by Paphangkorn Luanseng (i3artuf) on the live app after release PR #81. [Traceability §7](../../../../traceability.md).

| Item | Value |
|---|---|
| Release | PR #81 merged by jetanin 2026-11-27 11:58:08Z (18:58 Asia/Bangkok) as `3f80759439d628d97ee0b1f33deb1b1d87c6d39d` |
| Deploy | [Deploy run 45994749187](https://github.com/jetanin/LoungCheu/actions/runs/45994749187) success; Cloud Run revision `scccd8b05-00013-nwj` |
| Tag | annotated `v3.0.0-sprint-3` → `3f80759`, created after the ready check |
| App | `https://scccd8b05-4d7hbszvwq-as.a.run.app` |
| Check run | 2026-11-27 12:38:24–12:41:32 UTC (19:38–19:41 Asia/Bangkok), [postdeploy.mjs](postdeploy.mjs) over HTTPS, output [postdeploy-check.log](postdeploy-check.log) |
| Result | **19 passed / 0 failed** |

| Area | Check | Result |
|---|---|---|
| Release | `/api/ready` = `ready`, `db: connected`, version `3f80759…` | PASS |
| Auth | anonymous summary and own registrations → 401 AUTH_REQUIRED | PASS |
| NFR-03 | Lab 5 event `L5-C05-20261122-A` (`1a3914aa-…`) and ACTIVE registration `dd47235f-…` (registered 2026-11-22 13:05:51Z) still present after the Sprint 3 migration and redeploy; new `checked_in_at` is null | PASS |
| API 403 | participant.a: GET summary, POST check-in, GET roster of an organizer event → 403 ROLE_FORBIDDEN | PASS |
| F-08 | new event `D2-S3-POSTDEPLOY-202611271238` (`a767aaac-a320-4a59-8bb5-f827c3dde420`): create → publish → participant.a registers (`c3a1765b-…`) → check-in before starts_at 409 CHECK_IN_NOT_OPEN → after starts_at owner check-in 200 (`checked_in_at` 12:41:32.050Z) → repeat 409 ALREADY_CHECKED_IN → roster checked_in_count 1 → participant sees the same `checked_in_at` | PASS |
| F-09 | summary of the existing Lab 5 event 200 (1/0/0, "0.00"); new event before check-in 1/0/0 "0.00", after check-in ACTIVE 1, CANCELLED 0, checked-in 1, rate "100.00"; participant 403 | PASS |

## Notes

- The password was read from a local file outside the repository and is not in the script, the log or this README. The log contains no cookie or CSRF value. The file was deleted after the run.
- The smoke event and its registration stay in the production database as evidence. Its window ends 2026-11-27 13:38:26Z.
- Browser screenshots of the same records are listed below.

## Browser screenshots (Chrome incognito, 27 Nov 2026, Asia/Bangkok)

Same records as the API check above.

| File | Account | What it shows |
|---|---|---|
| `01-api-ready-3f80759_2026-11-27T1944.png` | — | `/api/ready`: `ready`, `db: connected`, version `3f80759439d628d97ee0b1f33deb1b1d87c6d39d` |
| `02-organizer-roster-checked-in_2026-11-27T1946.png` | organizer.a | Roster of `a767aaac-…`: "ลงทะเบียน ACTIVE 1 / 3 คน", "เช็กชื่อแล้ว 1 / ACTIVE 1 คน"; row `c3a1765b-…` Participant A, ACTIVE, registered 19:38:26, การเข้าร่วม "เช็กชื่อแล้ว 27 พ.ย. 2569 19:41:32" (F-08) |
| `03-organizer-summary-100_2026-11-27T1947.png` | organizer.a | Summary page: ACTIVE 1, CANCELLED 0, เช็กชื่อแล้ว 1, อัตราเข้าร่วม 100.00%; "ข้อมูล ณ 27 พ.ย. 2569 19:47:00" (F-09) |
| `04-participant-own-checked-in_2026-11-27T1948.png` | participant.a | Own registration `c3a1765b-…` of `D2-S3-POSTDEPLOY-202611271238`: ACTIVE; การเข้าร่วม "เช็กชื่อแล้วเมื่อ 27 พ.ย. 2569 19:41:32" (F-08 own status) |
| `05-participant-summary-refused_2026-11-27T1949.png` | participant.a | Summary URL of the same event: "เฉพาะผู้จัดกิจกรรมเท่านั้นที่ดูสรุปผลได้", no values (API returns 403, see log) |

The check-in time in the roster, the own registration and the API log is the same (12:41:32Z = 19:41:32 Asia/Bangkok). No password or other secret is visible in any image.
