# Part F — Working Sprint 1 Evidence Register

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](../events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](../events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026
Execution update 8 พ.ย. 2026: F-01–05 implementation บน feature/registration-views; F-04/F-05 commit eeafc31 + RV-01–03 working-tree correction. Current Vitest159/Chromium37/typecheck/build/smoke3 PASS ดู [Issue #4 source/results](../registration/views-verification.md); independent restart/reproduction/UAT, teammate approval, staging integration และ release acceptance ยังคง pending

## 1. Release identification

| รายการ | ค่า |
|---|---|
| Repository | https://github.com/jetanin/LoungCheu |
| Sprint staging | sprint-1-staging |
| GitHub project board URL / captured status/date | https://github.com/users/jetanin/projects/10/views/1 |
| Documentation history | [Changelog](../changelog.md) |
| Submitted main tag/commit | ยังไม่มี application release |
| Runtime/dependency/DB versions | Current tests: Node22.23.2 / PostgreSQL17.11 (isolated Docker55433); dependencies จาก checkout lockfile; source and log hashes in [manifest](../registration/evidence/review-fixes/manifest.json). Older17.6 evidence is historical |
| Environment / execution date / tester | Windows, isolated PostgreSQL55433, 8 พ.ย. 2026 Asia/Bangkok; Codex execution (AI assistance), not independent teammate acceptance |

## 2. Program demonstrations

แนบภาพ/output พร้อม Feature/AC, role, preconditions, steps, expected/actual และ tested commit; protected operations มี API/test evidence ประกอบ

| Evidence | Feature / AC | Scenario / expected result | Actual / commit |
|---|---|---|---|
| EV-01 | F-01–05 / AC-01,06,08,12,18,21,24 | OA Login/create/publish → PA Login/register/read saved result → OA roster; reference/count ตรง DB | PASS automated TEST-30: corrected registration-views.spec.ts real publish/register/own detail/re-login/roster reference/count journey; eeafc31 + RV-01 patch; [current logs](../registration/views-verification.md), not independent UAT |
| EV-02 | F-03 / AC-13–15 | Duplicate/full/closed ได้ 409 ตาม contract; count/records ไม่เพิ่ม | PASS registration.test.ts status/deadline/duplicate/full/no-write + real stale-full browser rejection; [record](../events/consistency-review.md) |
| EV-03 | F-01,F-02,F-04,F-05 / AC-04,10,19,22 | Cookie หลัง Logout=401; PA ใช้ owner API=403; OB ดู OA roster และ PA ดู PB registration=404 | PASS API/DB TEST-23/27 own/foreign/auth/role/minimal data; focused/full browser foreign reference and wrong-role access after account switch PASS; eeafc31 + RV-01 patch |
| EV-04 | Cross-feature / AC-25 | Restart แอปโดยไม่ reset DB แล้วอ่าน record/reference/count เดิมได้ | PARTIAL: automated createApp recreation คง Event/session/Registration reference/count PASS; ยังไม่ใช่ OS process restart/redeploy |

PA/PB/OA/OB และ event fixtures ตาม [STS](../sprints/sprint-1/sts.md)

## 3. Build/test evidence

| Evidence | เนื้อหาที่แนบ | Actual command / result / commit |
|---|---|---|
| EV-05 | Type-check/build/Vitest/Supertest/PostgreSQL concurrency | Current159 Vitest, 0 fail/skip; typecheck/build/compiled smoke3 PASS on Node22; eeafc31 + RV-01 patch, [logs/source manifest](../registration/views-verification.md) |
| EV-06 | Selected browser E2E และ manual UI/restart checks แยกกัน | Current37 Chromium, 0 fail/skip, includes2 corrected Issue #4 cases; full [e2e.log](../registration/evidence/review-fixes/e2e.log). Independent device/UAT/process restart NOT VERIFIED |
| EV-07 | Actual domain-rule setup/assertions/results เช่น TEST-16/20 | Event deadline/status/lock/concurrent publish และ F-03 TEST-16/20/21 duplicate/full races PASS; [record](../events/consistency-review.md) |
| EV-08 | Actual access-rule test excerpt เช่น TEST-23/27 | PASS real API TEST-23/27 in registration-views.test.ts plus existing TEST-12/13/19; own/foreign/anonymous/role/error privacy, eeafc31 + RV-01 patch; [source/results](../registration/views-verification.md) |
| EV-09 | Meaningful TDD red→green พร้อม test/implementation versions | Historical F-01–03 meaningful TDD kept in original records. RV-01 original committed suite0 PASS/2 FAIL is recorded in supplied review; corrected source focused2/full37 PASS. Environment setup failures are not domain RED; [review and current logs](../registration/views-verification.md) |

ผลแต่ละ AC ใช้ตารางหลักใน [Traceability](../traceability.md) เติม actual file/name/result และ tested commit

## 4. Issue/PR/integration evidence

เลือก 2 completed implementation Issues แสดงใน PDF; ทุก feature PR ยังต้อง review ตาม workflow

| Field | Chain 1: #3 / F-03 | Chain 2: #4 / F-04–05 |
|---|---|---|
| Requirement / AC / Test | FR-06 / AC-12–17 / TEST-15–21 | FR-07–08 / AC-18–23 / TEST-22–29 |
| Issue | [#3 Registration](https://github.com/jetanin/LoungCheu/issues/3) | [#4 Registration Views](https://github.com/jetanin/LoungCheu/issues/4) |
| Contract/test-design commit / วันที่ | — | — |
| Feature branch จาก sprint-1-staging / author / pair participants | — | feature/registration-views from events@9fcbfc8 (not direct staging); implementation eeafc31; PR author jetanin; pair participants not verified |
| PR เข้า staging / teammate reviewer | — | [PR #10](https://github.com/jetanin/LoungCheu/pull/10) OPEN/Draft → sprint-1-staging, head eeafc31; reviews=[] on8พ.ย. Reviewer/approval pending; PR9 CLOSED |
| Specific review finding หรือเหตุผลอนุมัติ / การแก้ / tests | — | AI repository review RV-01 account-switch setup + RV-02/03 docs; corrected working-tree patch focused2/full37/Vitest159 PASS. Not teammate approval; patch not pushed |
| Staging integration checks / merge commit | — | PR10 mergedAt=null on8พ.ย.; no verified staging integration/merge acceptance |
| Reviewed release PR เข้า main / release tag/commit | — | Not verified; no release acceptance claimed |

EV-10: ตาราง chains พร้อม readable GitHub/history evidence
EV-11: board URL, captured final status/date และ release reference
EV-10 PARTIAL: current Issue #4 commit/PR/review-fix facts captured in [GitHub snapshot](../registration/evidence/review-fixes/github-status.json); completed approved merge/release chains still missing. EV-11 board captured status/release reference NOT VERIFIED. Baseline review history remains in Decisions

## 5. Setup/reproduction — EV-12

| ขั้นตอน | Actual commands / outcome |
|---|---|
| Dependencies/runtime และ safe environment examples | npm workspaces, pinned packages/lockfile; templates คือ server/.env.example และ root .env.test.example; root .env.example ที่ซ้ำลบแล้ว; clean npm ci copy ผ่านโดย Codex; [README](../../README.md#local-setup--issue-1--f-01) และ pre-PR record |
| Database creation/migrations และ synthetic seed/private demo access | Current run used existing Docker db-test container127.0.0.1:55433/loungcheu_test, migrated auth/registration foundation; command-only TEST_DATABASE_URL override, no .env.test edit/app DB mutation. Single-instance5432 record is historical6พ.ย. |
| Build/run/test และ normal journey | Current F-01–05 Vitest159/Chromium37/typecheck/build/smoke3 PASS; real own read/re-login/roster journey included; eeafc31 + RV-01 patch. Independent clean reproduction and OS restart still pending |
| Teammate clean reproduction: tester/date/commit/result | NOT EXECUTED |

นำขั้นตอนจริงจาก README implementation มาสรุปใน PDF โดยไม่ใส่ secrets

## 6. Contributions / AI use

| สมาชิก | Design/implementation/tests/review/integration ที่ทำจริง | Evidence |
|---|---|---|
| M1: Jetanin Naitho 67070501011 | รอบันทึก | — |
| M2: Paphangkorn Luanseng 67070501083 | รอบันทึก | — |

AI-use declaration ดู [Changelog](../changelog.md)

## 7. Remaining work / limitations

| ID | งานที่ขาด | Next action |
|---|---|---|
| GAP-01 | F-04/F-05 implemented in eeafc31; RV-01–03 patch tested but not committed/pushed/reviewed | Review patch and verified source manifest; update PR10 after user commit/push; no implementation gap claimed |
| GAP-02 | Full automated own-list/roster journey PASS; independent process restart/reproduction/UAT missing | Execute separate independent acceptance and capture tester/date/revision |
| GAP-03 | PR10 OPEN/Draft/head eeafc31/no reviews/no merge verified8พ.ย.; approved integration/release chains incomplete | Obtain teammate review, staging integration checks/merge and reviewed release evidence; no inferred board status |
| GAP-04 | Final metadata/review/contribution verification และ release reference | สมาชิกตรวจข้อมูลและเติมตามงานจริง |
| GAP-05 | Self-contained PDF / page numbers | ประกอบหลังมีหลักฐาน |

เมื่อมี execution failures ให้เพิ่ม defect/failed/skipped records พร้อมผลกระทบและ next action
