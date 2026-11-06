# Part D — Three-Sprint Plan

**UI consistency follow-up:** ล่าสุด 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](../events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](../events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v0.5 | 5 พฤศจิกายน 2026 | Execution update 6 พ.ย.: F-01/F-03 อยู่ใน staging@ada659b และรวมกับ F-02 บน feature/events merge working tree แล้ว ผล 141 Vitest / 32 Chromium PASS ดู [combined verification](../events/consistency-review.md); รอ merge commit/teammate review, Issue #4 (F-04/F-05) และ main release; F-06–09 อยู่ Sprint 2/3

| Sprint | เป้าหมาย / Features | Dependencies | Completion outcome / Checkpoint |
|---|---|---|---|
| 1 | F-01–05: auth, create/publish/browse, registration, own records และ roster | Reviewed SRS/SDS/contracts/STS; DB/session foundation | Local working release บน main พร้อม tests/review/setup; D1 8 พ.ย. |
| 2 | F-06–07: cancel/reactivate/close และ edit/capacity rules | Accepted S1 และ shared locking convention; Lab 5/6 | S2 ครบ มี integrated tested release; D2 29 พ.ย. |
| 3 | F-08–09: check-in, own attendance และ summary; regression/hardening | F-04–07 และ contracts/STS ก่อน implement | มี working progress และ remaining-work list ใน D2; ครบ Final 13 ธ.ค. |

## Sprint 1 work breakdown

ทีมแจ้งว่าสร้าง Issues #1–4 แล้ว ตารางนี้ผูกขอบเขต baseline กับ Issues ดังกล่าว; ตรวจ/เติม requirement/contract links และ assignees ใน Issue ก่อน coding เพิ่ม setup/fix/change Issues ได้

| GitHub Issue | Features / ผลลัพธ์ | Branch ที่เสนอ |
|---|---|---|
| [#1 Authentication](https://github.com/jetanin/LoungCheu/issues/1) | F-01; FR-01–02; AC-01–05: auth/CSRF/seed | feature/auth |
| [#2 Event Management](https://github.com/jetanin/LoungCheu/issues/2) | F-02; FR-03–05,08; AC-06–11: event schema/create/publish/browse | feature/events |
| [#3 Registration](https://github.com/jetanin/LoungCheu/issues/3) | F-03; FR-06; AC-12–17: duplicate/capacity/concurrency | feature/registration |
| [#4 Registration Views](https://github.com/jetanin/LoungCheu/issues/4) | F-04–05; FR-07–08; AC-18–23: own records/roster | feature/registration-views |

ทุก Issue เชื่อม AC-24–27/DoD ที่เกี่ยวข้องด้วย Setup workspace/config/build/test/migrations ตาม System SDS เป็นขั้นแรกของ #1 หรือ setup Issue แยกตามที่ทีมตกลง

Workflow: version contracts/test design ก่อน implement → feature branch จาก `sprint-1-staging` → teammate-reviewed PR กลับ staging → integration/system/acceptance checks → reviewed release PR เข้า `main` → บันทึก release tag/commit

Baseline integration สำเร็จแล้ว: รวม unrelated histories/แก้ conflict ที่ `f5339b9` บน `docs/deliverable-1-baseline`; [PR #5](https://github.com/jetanin/LoungCheu/pull/5) ได้ review APPROVED จาก jetanin และ merge เข้า `sprint-1-staging` ที่ `5395942` เมื่อ 6 พ.ย. 2026 00:26:37 Asia/Bangkok จึงไม่ต้องใช้แผนคัดลอกเอกสารเข้า branch ใหม่ที่เสนอไว้ก่อนหน้า

ตรวจ GitHub/remote ก่อนเริ่ม F-01: staging ตรง `5395942`, ไม่พบ open PR, Issue #1 ยัง open ไม่มี body/assignee และ `feature/auth` ในเครื่องเริ่มจาก staging commit นี้ เก็บ scope/contract links สำหรับ Issue #1 ใน [auth work record](sprint-1/auth-work-record.md); ยังไม่ได้แก้ Issue หรือส่ง review request ไป GitHub

ต้องมี GitHub project board ตาม master หน้า 4 Board/Kanban และคอลัมน์ต่อไปนี้เป็น convention ของทีม; URL/สถานะจริงรอบันทึกใน evidence register

| Status | เงื่อนไข |
|---|---|
| Backlog | ยังไม่พร้อมเริ่ม |
| Ready | Scope/contract/STS พร้อมและมีผู้รับผิดชอบ |
| In Progress | กำลัง implement/test |
| In Review | เปิด PR หรือรอ acceptance/integration |
| Done | ผ่าน [DoD](sprint-1/README.md) รวม reviewed integration และ accepted main release |

Merge เข้า staging แล้วแต่ยังไม่ผ่าน release acceptance ให้คง In Review การปิด Issue/ย้าย Done ต้องตรงหลักฐานจริง

## Proposed assignments

M1/M2 ตาม [README](../../README.md) ทั้งคู่ร่วม design, implementation, testing และ review

| งาน | Driver | Reviewer | Dependencies |
|---|---|---|---|
| Scope/design/contract review | M1+M2 | ตรวจร่วมกัน | ตกลง baseline |
| #1 / F-01 | M1 | M2 | Workspace/seed/session foundation |
| #2 / F-02 | M2 | M1 | F-01 |
| #3 / F-03 | M1 | M2 | F-02 และ PostgreSQL transaction |
| #4 / F-04–05 | M2 | M1 | F-03 |
| Integration/reproduction/report | M1+M2 | ผู้ไม่ใช่ release PR author | Features/tests พร้อม |

ผู้เขียน PR ไม่ approve งานตนเอง ทุก review ระบุสิ่งที่ตรวจ/ข้อค้นพบ/เหตุผลอนุมัติ Pair work ให้ระบุผู้ร่วมและบทบาทตามจริง

## Target dates และงานต่อเนื่อง

| ช่วง | เป้าหมาย |
|---|---|
| 4–5 พ.ย. | Baseline/Issues, F-01/F-02 พร้อม tests และ review |
| 6 พ.ย. | F-03–05 และ concurrency/access tests |
| 7–8 พ.ย. | Integration, restart/clean reproduction, release และ PDF; ส่ง D1 ก่อน 8 พ.ย. 23:59 |
| ไม่เกิน 15 พ.ย. | Lab 5: Docker, CI quality gate, GCP และ persistence |
| ไม่เกิน 22 พ.ย. | S2 development; Lab 6 independent UAT และ defect fix/re-test |
| ไม่เกิน 29 พ.ย. | S2 ครบ, S3 contracts/progress และ D2 deployed candidate; Lab 7 approved maintenance change |
| 1–11 ธ.ค. | ช่วงสอบ: จำกัดงานคงเหลือเป็นงานที่มี owner/วันเสร็จชัดเจน |
| ไม่เกิน 13 ธ.ค. | S3 ครบ, final regression/re-tests, deployment, PDF และ demo video |

Lab 7 เปลี่ยน behavior ที่ implement แล้วและได้รับ TA approval; required baseline feature ที่ยังไม่ทำใช้แทน maintenance ไม่ได้

## Scope control

- D1 ใช้ local build/test results; Docker/CI/GCP เสร็จใน Lab 5
- ทุก release อัปเดต traceability, documents, limitations และ evidence ตาม commit
- การเปลี่ยน scope บันทึกเหตุผล/IDs และการตกลงที่เกี่ยวข้อง
- D2 ต้องมี S2 ครบและ S3 progress จริง; remaining work ระบุ feature/AC, owner, dependency, next action และวันเสร็จ
- ก่อน Sprint 2/3 ระบุ staging branch และ accepted main commit ที่ใช้เป็นฐาน
