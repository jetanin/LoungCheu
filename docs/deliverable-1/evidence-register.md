# Part F — Working Sprint 1 Evidence Register

Documentation baseline v0.5 | 5 พฤศจิกายน 2026
Execution update 6 พ.ย. 2026: setup/F-01 มี partial Sprint 1 evidence ใน [auth execution record](evidence/auth/README.md); baseline PR #5 approved/merged แล้ว ส่วน feature review, F-02–05, integration/release และ teammate reproduction ยังขาด

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
| EV-01 | F-01–05 / AC-01,06,08,12,18,21,24 | OA Login/create/publish → PA Login/register/read saved result → OA roster; reference/count ตรง DB | MISSING / — |
| EV-02 | F-03 / AC-13–15 | Duplicate/full/closed ได้ 409 ตาม contract; count/records ไม่เพิ่ม | MISSING / — |
| EV-03 | F-01,F-02,F-04,F-05 / AC-04,10,19,22 | Cookie หลัง Logout=401; PA ใช้ owner API=403; OB ดู OA roster และ PA ดู PB registration=404; ไม่คืน private data | MISSING / — |
| EV-04 | Cross-feature / AC-25 | Restart แอปโดยไม่ reset DB แล้วอ่าน record/reference/count เดิมได้ | MISSING / — |

PA/PB/OA/OB และ event fixtures ตาม [STS](../sprints/sprint-1/sts.md)

## 3. Build/test evidence

| Evidence | เนื้อหาที่แนบ | Actual command / result / commit |
|---|---|---|
| EV-05 | Type-check, client/backend build, Vitest/Supertest และ PostgreSQL concurrency; pass/fail/skipped counts | PARTIAL: pre-PR typecheck/build PASS, F-01 unit/API/DB 54 PASS, 0 fail/skip, compiled smoke 3 PASS; concurrency NOT EXECUTED; [latest logs/source manifests](../sprints/sprint-1/auth-pre-pr-review.md) |
| EV-06 | Selected browser E2E และ manual UI/restart checks แยกกัน | F-01 pre-PR browser E2E 7 PASS, 0 fail/skip พร้อม screenshots; all earlier failures preserved; manual/domain process restart NOT EXECUTED; [record](evidence/auth/README.md) |
| EV-07 | Actual domain-rule test excerpt: setup/assertions และผลรัน เช่น TEST-16/20 | MISSING / — |
| EV-08 | Actual access-rule test excerpt เช่น TEST-23/27 พร้อมผลรัน | MISSING / — |
| EV-09 | Meaningful TDD red→green พร้อม test/implementation versions | F-01 TEST-06 fixed expiry และ pre-PR UI session race/JSON charset/config validation red→green; snapshots/logs/SHA256 ใน [auth evidence](evidence/auth/README.md); F-03 domain TDD ยังต้องเก็บเพิ่ม |

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
| Build/run/test และ normal journey | F-01 typecheck/build/unit/API/built smoke และ browser 7 cases PASS; same source ใน clean dependency copy build/compiled smoke ได้; full F-01–05 journey ยัง NOT EXECUTED |
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
| GAP-01 | F-01 implementation มีแล้ว ยังไม่ commit/review/integrate; F-02–05 ยังขาด | Review auth diff/evidence แล้วทำ feature PR; พัฒนา #2–4 ตาม contracts |
| GAP-02 | F-01 unit/API/browser และ expiry TDD มีแล้ว; manual/domain/concurrency/restart evidence ยังขาด | ทำ domain/integration suites ตาม STS และ teammate reproduction |
| GAP-03 | Baseline unrelated histories/review/merge แก้แล้วที่ f5339b9/PR #5/staging 5395942; feature PR/review/release ยังขาด | ยืนยัน assignee/board, feature teammate review และ release chains ตามจริง |
| GAP-04 | Final metadata/review/contribution verification และ release reference | สมาชิกตรวจข้อมูลและเติมตามงานจริง |
| GAP-05 | Self-contained PDF / page numbers | ประกอบหลังมีหลักฐาน |

เมื่อมี execution failures ให้เพิ่ม defect/failed/skipped records พร้อมผลกระทบและ next action
