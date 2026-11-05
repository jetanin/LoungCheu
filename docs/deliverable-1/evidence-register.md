# Part F — Working Sprint 1 Evidence Register

Documentation baseline v0.5 | 5 พฤศจิกายน 2026
Execution evidence: MISSING / NOT EXECUTED; Issues #1–4 มีแล้วตามข้อมูลทีม ส่วน PR/review/board/release evidence ยังรอบันทึก

## 1. Release identification

| รายการ | ค่า |
|---|---|
| Repository | https://github.com/jetanin/LoungCheu |
| Sprint staging | sprint-1-staging |
| GitHub project board URL / captured status/date | https://github.com/users/jetanin/projects/10/views/1 |
| Documentation history | [Changelog](../changelog.md) |
| Submitted main tag/commit | ยังไม่มี application release |
| Runtime/dependency/DB versions | รอ pin ตอน implement |
| Environment / execution date / tester | รอการรันจริง |

## 2. Program demonstrations

แนบภาพ/output พร้อม Feature/AC, role, preconditions, steps, expected/actual และ tested commit; protected operations มี API/test evidence ประกอบ

| Evidence | Feature / AC | Scenario / expected result | Actual / commit |
|---|---|---|---|
| EV-01 | F-01–05 / AC-01,06,08,12,18,21,24 | OA Login/create/publish → PA Login/register/read saved result → OA roster; reference/count ตรง DB | MISSING / — |
| EV-02 | F-03 / AC-13–15 | Duplicate/full/closed ได้ 409 ตาม contract; count/records ไม่เพิ่ม | MISSING / — |
| EV-03 | F-01,F-02,F-04,F-05 / AC-04,10,19,22 | Cookie หลัง Logout=401; PA ใช้ owner API=403; OB ดู OA roster และ PA ดู PB registration=404; ไม่คืน private data | MISSING / — |
| EV-04 | Cross-feature / AC-25 | Restart แอปโดยไม่ reset DB แล้วอ่าน record/reference/count เดิมได้ | MISSING / — |

PA/PB/OA/OB และ event fixtures ตาม [STS](../sprints/sprint-1/sts.md)

## 3. Build/test evidence

| Evidence | เนื้อหาที่แนบ | Actual command / result / commit |
|---|---|---|
| EV-05 | Type-check, frontend/backend build, Vitest/Supertest และ PostgreSQL concurrency; pass/fail/skipped counts | NOT EXECUTED / — |
| EV-06 | Selected browser E2E และ manual UI/restart checks แยกกัน | NOT EXECUTED / — |
| EV-07 | Actual domain-rule test excerpt: setup/assertions และผลรัน เช่น TEST-16/20 | MISSING / — |
| EV-08 | Actual access-rule test excerpt เช่น TEST-23/27 พร้อมผลรัน | MISSING / — |
| EV-09 | Meaningful TDD red→green พร้อม test/implementation versions | MISSING / — |

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
| Dependencies/runtime และ safe environment examples | — |
| Database creation/migrations และ synthetic seed/private demo access | — |
| Build/run/test และ normal journey | — |
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
| GAP-01 | Implementation F-01–05 | พัฒนาตาม contracts |
| GAP-02 | Executed automated/manual tests และ TDD | Implement/run และเก็บ results/versions |
| GAP-03 | Issues #1–4 มีแล้ว; board/PR/review/release evidence ยังขาด และ local baseline/staging ไม่มี common ancestor | เตรียม baseline branch ตาม sprint plan; เชื่อม board และเก็บ history |
| GAP-04 | Final metadata/review/contribution verification และ release reference | สมาชิกตรวจข้อมูลและเติมตามงานจริง |
| GAP-05 | Self-contained PDF / page numbers | ประกอบหลังมีหลักฐาน |

เมื่อมี execution failures ให้เพิ่ม defect/failed/skipped records พร้อมผลกระทบและ next action
