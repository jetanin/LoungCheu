# Part F — Working Sprint 1 Evidence Register

**UI consistency follow-up:** ล่าสุด 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](../events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](../events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026
Execution update 6 พ.ย. 2026: F-01/F-02/F-03 รวมใน feature/events merge working tree (04106ff + ada659b), 141 Vitest / 32 Chromium PASS ดู [combined evidence](../events/consistency-review.md) รอ Issue #4 (F-04/F-05), merge commit, review/release และ independent reproduction

## 1. Release identification

| รายการ | ค่า |
|---|---|
| Repository | https://github.com/jetanin/LoungCheu |
| Sprint staging | sprint-1-staging |
| GitHub project board URL / captured status/date | https://github.com/users/jetanin/projects/10/views/1 |
| Documentation history | [Changelog](../changelog.md) |
| Submitted main tag/commit | ยังไม่มี application release |
| Runtime/dependency/DB versions | Node 22.16.0 / npm 11.11.0 / PostgreSQL 17.6; exact versions ใน package-lock.json และ auth evidence |
| Environment / execution date / tester | Windows, local isolated PostgreSQL, 6 พ.ย. 2026 Asia/Bangkok; Codex execution (AI assistance), ไม่ใช่ independent teammate test |

## 2. Program demonstrations

แนบภาพ/output พร้อม Feature/AC, role, preconditions, steps, expected/actual และ tested commit; protected operations มี API/test evidence ประกอบ

| Evidence | Feature / AC | Scenario / expected result | Actual / commit |
|---|---|---|---|
| EV-01 | F-01–05 / AC-01,06,08,12,18,21,24 | OA Login/create/publish → PA Login/register/read saved result → OA roster; reference/count ตรง DB | PARTIAL: real create/publish/register/reference/count API/DB/browser PASS; own GET/list/roster pending Issue #4; [combined record](../events/consistency-review.md) |
| EV-02 | F-03 / AC-13–15 | Duplicate/full/closed ได้ 409 ตาม contract; count/records ไม่เพิ่ม | PASS registration.test.ts status/deadline/duplicate/full/no-write + real stale-full browser rejection; [record](../events/consistency-review.md) |
| EV-03 | F-01,F-02,F-04,F-05 / AC-04,10,19,22 | Cookie หลัง Logout=401; PA ใช้ owner API=403; OB ดู OA roster และ PA ดู PB registration=404 | PARTIAL: F-01–03 session/current role/CSRF + Event owner scope/API/UI stale-response PASS; F-04/F-05 ownership pending |
| EV-04 | Cross-feature / AC-25 | Restart แอปโดยไม่ reset DB แล้วอ่าน record/reference/count เดิมได้ | PARTIAL: automated createApp recreation คง Event/session/Registration reference/count PASS; ยังไม่ใช่ OS process restart/redeploy |

PA/PB/OA/OB และ event fixtures ตาม [STS](../sprints/sprint-1/sts.md)

## 3. Build/test evidence

| Evidence | เนื้อหาที่แนบ | Actual command / result / commit |
|---|---|---|
| EV-05 | Type-check/build/Vitest/Supertest/PostgreSQL concurrency | ล่าสุด145 Vitest/0 fail/skip, typecheck/build และ compiled smoke3 PASS; [UI follow-up logs/source](../events/visual-consistency.md); domain race coverage คงเดิม |
| EV-06 | Selected browser E2E และ manual UI/restart checks แยกกัน | ล่าสุด35 Chromium/0 fail/skip รวม51 measured render contexts/3 widths และ selected before-after screenshots; independent UAT/process restart NOT EXECUTED; [UI record](../events/visual-consistency.md) |
| EV-07 | Actual domain-rule setup/assertions/results เช่น TEST-16/20 | Event deadline/status/lock/concurrent publish และ F-03 TEST-16/20/21 duplicate/full races PASS; [record](../events/consistency-review.md) |
| EV-08 | Actual access-rule test excerpt เช่น TEST-23/27 | PARTIAL: F-02 TEST-12/13 + F-03 TEST-19 real auth/role/CSRF/input/session-owner PASS; F-04/F-05 TEST-23/27 pending |
| EV-09 | Meaningful TDD red→green พร้อม test/implementation versions | F-01 historical TDD, F-02 original/audit + consistency validation/UI RED→GREEN logs, F-03 historical domain TDD ใน registration/verification.md; [current source/results](../events/consistency-review.md); ไม่มี red/green commits แยก |

ผลแต่ละ AC ใช้ตารางหลักใน [Traceability](../traceability.md) เติม actual file/name/result และ tested commit

## 4. Issue/PR/integration evidence

เลือก 2 completed implementation Issues แสดงใน PDF; ทุก feature PR ยังต้อง review ตาม workflow

| Field | Chain 1: #3 / F-03 | Chain 2: #4 / F-04–05 |
|---|---|---|
| Requirement / AC / Test | FR-06 / AC-12–17 / TEST-15–21 | FR-07–08 / AC-18–23 / TEST-22–29 |
| Issue | [#3 Registration](https://github.com/jetanin/LoungCheu/issues/3) | [#4 Registration Views](https://github.com/jetanin/LoungCheu/issues/4) |
| Contract/test-design commit / วันที่ | — | — |
| Feature branch จาก sprint-1-staging / author / pair participants | — | — |
| PR เข้า staging / teammate reviewer | — | — |
| Specific review finding หรือเหตุผลอนุมัติ / การแก้ / tests | — | — |
| Staging integration checks / merge commit | — | — |
| Reviewed release PR เข้า main / release tag/commit | — | — |

EV-10: ตาราง chains พร้อม readable GitHub/history evidence
EV-11: board URL, captured final status/date และ release reference
ทั้งคู่ยัง MISSING; baseline review บันทึกใน [Decisions](../decisions.md)

## 5. Setup/reproduction — EV-12

| ขั้นตอน | Actual commands / outcome |
|---|---|
| Dependencies/runtime และ safe environment examples | npm workspaces, pinned packages/lockfile; templates คือ server/.env.example และ root .env.test.example; root .env.example ที่ซ้ำลบแล้ว; clean npm ci copy ผ่านโดย Codex; [README](../../README.md#local-setup--issue-1--f-01) และ pre-PR record |
| Database creation/migrations และ synthetic seed/private demo access | App DB loung-cheu-database และ test DB loungcheu_test อยู่ instance localhost:5432 เดียวกันและแยก database; migrate/seed/tests ผ่าน, cluster 55432 หยุดแล้ว, passwords ไม่อยู่ใน evidence ดู [single-instance record](../sprints/sprint-1/single-instance-db.md) |
| Build/run/test และ normal journey | F-01–03 typecheck/build/built smoke + 141 Vitest/32 Chromium PASS; real create/publish/register/reference/count บน test DB; independent clean reproduction/full F-01–05 journey ยัง pending |
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
| GAP-01 | F-01–03 combined working tree ทดสอบแล้ว; Issue #4 (F-04/F-05) ยังไม่รวม | Review combined diff/evidence และต่อ own GET/list/roster ตาม contracts โดยใช้ foundation เดิม |
| GAP-02 | Event/Registration domain/concurrency/lifecycle ผ่าน; full own-list/roster journey, process restart/UAT ยังขาด | รวม Issue #4 แล้วทำ independent restart/reproduction/UAT ที่เหลือ |
| GAP-03 | Baseline/Auth/Registration merge มี local Git evidence; F-02 teammate review/merge commit/release ยังขาด | ตรวจ assignee/board/PR จริงตอนส่ง, teammate review และ release chains; รอบนี้ไม่อ้าง live GitHub audit |
| GAP-04 | Final metadata/review/contribution verification และ release reference | สมาชิกตรวจข้อมูลและเติมตามงานจริง |
| GAP-05 | Self-contained PDF / page numbers | ประกอบหลังมีหลักฐาน |

เมื่อมี execution failures ให้เพิ่ม defect/failed/skipped records พร้อมผลกระทบและ next action
