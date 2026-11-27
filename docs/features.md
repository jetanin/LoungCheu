# Part B — Feature Inventory

**สถานะปัจจุบัน — 27 พ.ย. 2026:** F-08/F-09 release บน main เป็น `v3.0.0-sprint-3` (`3f80759`, release PR #81 merge 27 พ.ย. 18:58 Asia/Bangkok; CI run 45991439969 Vitest 37 files, Playwright 41/41; deploy run 45994749187 → revision `scccd8b05-00013-nwj`, `/api/ready` version = `3f80759`; [post-deploy check](sprints/sprint-3/evidence/release-v3.0.0/README.md) 19/19 PASS)

**สถานะ — 26 พ.ย. 2026 (ประวัติ):** F-06/F-07 release บน main เป็น `v2.0.0-sprint-2` (`c0faf24`, release PR #67 merge 26 พ.ย. 00:45 Asia/Bangkok; CI run 45666007554 Vitest 264/264, Playwright 39/39; deploy run 45668146212 → revision `scccd8b05-00011-fvb`, `/api/ready` version = `c0faf24`). Main ปัจจุบัน `v2.0.1-lab6` (`6f49d32`) เพิ่มเพียง test/เอกสารของ Lab 6 controlled exercise ไม่เปลี่ยนโค้ดแอป. F-08/F-09 contract/STS อยู่ใน PR #71 → `sprint-3-staging` ยังไม่ implement

**สถานะ — 25 พ.ย. 2026 (ประวัติ):** F-01–05 release บน main (`v1.0.0-sprint-1`, แล้ว `v1.0.1-uat`/`0b2cc80`) และผ่าน independent UAT ของทีม TH-005_P5 (7/7 PASS, Accepted 25 พ.ย.). F-06/F-07 merge เข้า `sprint-2-staging` แล้ว CI ผ่าน ยังไม่ release บน main. F-08/F-09 มี contract/STS ร่างใน Issue #49 ยังไม่ implement. ดูตาราง "สถานะ" ท้ายไฟล์; ข้อความลงวันที่ด้านล่างเป็นประวัติ

**สถานะหลักฐาน — 14 พ.ย. 2026:** PR #7/#10 ได้ teammate review โดย i3artuf และ merge เข้า sprint-1-staging แล้ว ตาม snapshot 12 พ.ย.; PR #10 reviewed head `0bd3468`, merge `97a5b91` (10 พ.ย. 16:26:11 Asia/Bangkok). ผล 159 Vitest / 37 Chromium / typecheck / build / compiled smoke 3 PASS เป็นผลรัน 8 พ.ย. ของ source ที่ commit เป็น `3313288`; รอบแก้เอกสารนี้ไม่ได้รันทดสอบแอปใหม่. OS-process restart, independent clean reproduction/UAT และ reviewed main release ยังขาดหลักฐาน; GAP-02 ยัง OPEN และ Product DoD ยังไม่ครบ. [Review/merge evidence](deliverable-1/evidence/review-merge-20261112/README.md). Baseline FR/BR/NFR/AC ไม่เปลี่ยน; F-06–09 อยู่ Sprint 2/3

**Historical Event UI run — 6 พ.ย. 2026:** 145 Vitest / 35 Chromium, typecheck/build/compiled smoke PASS รวม typography/layout/state checks ที่1280/390/320px ดู [current UI evidence](events/visual-consistency.md) ผล141/32 และ seed follow-up ด้านล่างเป็น historical runs

**Seed follow-up (6 พ.ย.):** full Vitest **145 PASS** รวม seed integration ใหม่4 และ typecheck PASS; 141/32 ใน feature audit ด้านล่างเป็นรอบก่อนเพิ่ม seed โดย Chromium/build ไม่ได้ rerun รอบ seed ดู [latest seed results](events/demo-seed.md) ไม่มี AC/scope ใหม่

Documentation baseline v1.0 | พฤศจิกายน 2026 | F-01 ถึง F-05 รวมเข้าสู่ `sprint-1-staging` ครบถ้วน พร้อมเปิด Release PR เข้าสู่ `main`

Registration integration update: F-01–05 implemented; PR #7/#10 approved/merged staging ตาม retained snapshots. Automated159/37 results ผูก source3313288; OS-process restart, independent clean reproduction/UAT และ accepted main release ยังไม่ครบ ดู [verification](registration/views-verification.md).

| ID | Feature / ผลลัพธ์ | Requirement / Rules | Dependency | Sprint |
|---|---|---|---|---:|
| F-01 | Login, identity และ Logout สำหรับ demo users | FR-01–02; BR-06–07; NFR-01–02 | Seed users, session store | 1 |
| F-02 | สร้าง/เผยแพร่กิจกรรม ดูกิจกรรมที่เผยแพร่ และรายการกิจกรรมของผู้จัด | FR-03–05, FR-08 ส่วนรายการกิจกรรม; BR-01–02,07,09,11,14 | F-01 | 1 |
| F-03 | ลงทะเบียนโดยคุม duplicate, deadline และ capacity | FR-06; BR-03–07,10,14; NFR-04 | F-01, F-02 | 1 |
| F-04 | ดูรายการและรายละเอียด registration ของตน; เพิ่มสถานะ check-in ผ่าน F-08 ใน S3 | FR-07; BR-06 | F-03 | 1 |
| F-05 | ดู roster และ ACTIVE count ของกิจกรรมตน | FR-08 ส่วน roster; BR-07 | F-02, F-03 | 1 |
| F-06 | ยกเลิก ลงทะเบียนใหม่ และปิดรับกิจกรรม | FR-09–10,12; BR-03–11,14 | F-03–05 | 2 |
| F-07 | แก้รายละเอียดและปรับความจุแบบไม่ทำให้ข้อมูลผิดกฎ | FR-11; BR-01–02,05,07,10–11,14 | F-02, F-03 | 2 |
| F-08 | เช็กชื่อและเพิ่ม own attendance status ใน F-04 | FR-13–14; BR-06–07,12,14 | F-04–06, F-07 (เวลา/สถานะกิจกรรม) | 3 |
| F-09 | สรุปการลงทะเบียน ยกเลิก และอัตราเข้าร่วม | FR-15; BR-07,13 | F-05, F-06, F-08 | 3 |

## System responsibilities

| ID | ความรับผิดชอบร่วม | Owner feature / ตรวจ |
|---|---|---|
| SYS-AUTH | Authentication, role, record ownership, cookie, CSRF และ password policy | F-01 วางพื้นฐาน; ทุก feature ต้องตรวจ endpoint ของตน |
| SYS-DATA | Database constraints, migration, transaction, UTC และ seed | F-01 วาง User/session migration/seed; F-02/F-03 วาง domain/transaction foundation; F-06/F-07/F-08 รักษากฎร่วม |
| SYS-UX | Error contract, validation, loading และ empty state | F-01–05 เริ่ม; ทุก feature รักษา convention |
| SYS-DELIVERY | Reproduction, Docker, CI gate, GCP และ version identification | Sprint 1 ออกแบบ/ local setup; Lab 5 ทำจริง; ทุก release หลังจากนั้น |
| SYS-QA | AC→test traceability, regression และ independent UAT | ทุก Sprint; Lab 6 ทำ UAT; Lab 7 ทำ maintenance |

## สถานะ — 25 พฤศจิกายน 2026

| Feature | Planned | In progress | Implemented | Tested | Accepted |
|---|---|---|---|---|---|
| F-01–F-05 | ✓ | — | ✓ | ✓ CI + browser | ✓ release `v1.0.1-uat`; UAT Accepted 25 พ.ย. 2026 |
| F-06 | ✓ | — | ✓ PR #59 | ✓ CI PR #59/#60/#67 | ✓ release `v2.0.0-sprint-2` (`c0faf24`, PR #67) |
| F-07 | ✓ | — | ✓ PR #57 | ✓ CI PR #57/#60/#67 | ✓ release `v2.0.0-sprint-2` (`c0faf24`, PR #67) |
| F-08 | ✓ contract #49 (PR #71) | — | ✓ PR #78, #79, #80 | ✓ CI PR #78/#79/#80/#81 | ✓ release `v3.0.0-sprint-3` (`3f80759`, PR #81) |
| F-09 | ✓ contract #49 (PR #71) | — | ✓ PR #75 | ✓ CI PR #75/#81 | ✓ release `v3.0.0-sprint-3` (`3f80759`, PR #81) |

หมายเหตุ 25 พ.ย. 2026: เพิ่ม BR-05 ให้ F-07 ตามที่ [Sprint 2 contract](sprints/sprint-2/contracts.md) และ traceability ระบุไว้แล้ว (ลด capacity พร้อมการลงทะเบียนต้องไม่ทำให้ ACTIVE เกิน capacity) ไม่ใช่ข้อกำหนดใหม่

Sprint ของ F-04 คือการสร้าง capability เริ่มต้น; FR-14 อยู่ใน F-08/S3 ซึ่งขยายหน้าเดิม Allocation ราย FR/BR/NFR ฉบับเต็มอยู่ใน [Traceability](traceability.md); ตารางนี้สรุป requirement หลัก
