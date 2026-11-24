# Lab 6 Part B — ผล UAT ของ ApprovalFlow (เราเป็น UAT Team)

Issue #43 | Product Team: TH-005_P5 ApprovalFlow — Naphat Utabuawong (67070501015), Nantakorn Pinsupaporn (67070501028)
UAT Team (เรา): TH-001_P3 LoungCheu — Paphangkorn Luanseng (67070501083, M2), Jetanin Naitho (67070501011, M1)

เคสและ expected ทั้งหมดมาจาก handoff ของทีมคู่: [uat-handoff.md บน branch `docs/lab6-uat`](https://github.com/AlphabetCG/approvalflow/blob/b21c634579582c797b0a3995822f8ed539eed7e7/docs/labs/lab-06/uat-handoff.md) (commit `b21c634`, PR #38 ยังไม่ merge) ไฟล์นี้บันทึกเฉพาะสิ่งที่เราเห็นจริง ไม่มีรหัสผ่าน (รับทาง IG DM)

## 1. Release ที่ทดสอบ

| รายการ | ค่า | ที่มา |
|---|---|---|
| URL | https://approvalflow-lecxxyja2q-as.a.run.app | handoff §1 |
| Tag / commit | `v0.2.0` / `1cbd8b46df495d4c748817ab8f92f1cce4143485` | handoff §1; เราตรวจแล้วว่า tag ชี้ commit นี้ |
| Cloud Run revision | `approvalflow-00006-8bp` (100% traffic) | ทีมคู่ยืนยันทาง IG 24 พ.ย. (EV-B-00b) |
| Image digest | `<ค่าจากทีมคู่>` — build จาก `1cbd8b4`; revision 00006-8bp เกิดจากปรับการตั้งค่าใน Cloud Console เท่านั้น โค้ดเหมือน v0.2.0 | ทีมคู่ยืนยันทาง IG 24 พ.ย. (EV-B-00b) |
| Sprint 1 baseline | `v0.1.0` (PR #18); v0.1.0 → v0.2.0 เปลี่ยนเฉพาะ delivery + ข้อความหน้าแรก 1 ประโยค | handoff §1 |
| วิธีเช็ก version | แอปไม่มี version endpoint — ทีมคู่สัญญาประกาศทุก deploy ใน IG; ไม่มีประกาศ deploy ระหว่างที่เราทดสอบ `<ยืนยันตอนจบ>` | handoff §1 |

Tested version ที่ใช้ทุกแถวด้านล่าง: **`v0.2.0 / 1cbd8b4 / approvalflow-00006-8bp`**

## 2. คำถามที่ถามทีมคู่ก่อนรัน (L6 §3.3 Reproduce and clarify)

| # | คำถาม (24 พ.ย.) | คำตอบ | หลักฐาน |
|---|---|---|---|
| Q1 | ใช้ไฟล์ใน branch `docs/lab6-uat` เป็นฉบับทางการได้ไหม | ได้ | EV-B-00a |
| Q2 | revision จริง 00006-8rh หรือ 00006-8bp | ตอบแรกว่า "น่าจะ bp ก็อปผิด"; ยืนยันในข้อความ digest ว่าเป็น 00006-8bp (00005-8rh คือ revision แรกของ image เดียวกัน) | EV-B-00a, EV-B-00b |
| Q3 | image digest | `<ค่า>` ของ 00006-8bp; build จาก 1cbd8b4; revision ใหม่จากการตั้งค่าใน Console เท่านั้น | EV-B-00b |
| Q4 | ตั้งค่าอะไรใน Console (env/secret/scaling) | `<รอ>` | `<EV>` |

## 3. ผลการรัน (L6 §3.2)

Prefix ข้อมูลของเรา: `UAT-P3-<เคส>` | Actual = สิ่งที่หน้าจอแสดงจริง ห้ามคัด expected | ทุกเคสที่มีการปฏิเสธ แคป 2 ภาพ (การปฏิเสธ + สถานะที่ไม่เปลี่ยน)

| Case | หมวด | Tester / team | วันที่-เวลา (Bangkok) | Tested version | Inputs ที่ใช้จริง | Actual result | PASS / FAIL / BLOCKED | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| UAT-01 | Normal journey | Paphangkorn / TH-001_P3 | | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG1 → reviewer `<จด>`; `UAT-P3-01 Team lunch`, Training, 1500.50 | | | |
| UAT-02 | Boundary (amount) | Paphangkorn / TH-001_P3 | | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG2; 0, 100000.01, 12.345, ชื่อว่าง, 0.01, 100000 | | | |
| UAT-03 | Business rule (reject reason) | Paphangkorn / TH-001_P3 | | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-FIN1 → reviewer `<จด>`; `No budget`, ช่องว่าง, `No budget left` | | | |
| UAT-04 | Forbidden role / ownership | Jetanin / TH-001_P3 | | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG1, REQ-FIN1, REV-FIN1, reviewer `<จด>`; `UAT-P3-04 Monitor` | | | |
| UAT-05 | Forbidden (reviewer own request) | Jetanin / TH-001_P3 | | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REV-ENG1 → REV-ENG2; `UAT-P3-05 Keyboard` | | | |
| UAT-06 | State / history / persistence | Jetanin / TH-001_P3 | | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG2 → reviewer `<จด>`; 2 แท็บ; `OK for Q4` / `Changed my mind` | | | |
| UAT-07 | Sign-in / session | Paphangkorn / TH-001_P3 | | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG1; `wrong-password-1`, `nobody@example.com`, ` REQ.ENG1@Example.com ` | | | |
| **รวม** | | | | | | | PASS `_` / FAIL `_` / BLOCKED `_` | |

Evidence: `docs/labs/lab-06/evidence/approvalflow/EV-B-<nn>_UAT-<xx>_<สั้น>_2026-11-<dd>T<hhmm>.png` (ไม่มีรหัสผ่านในภาพ)

## 4. Finding ที่ส่งทีมคู่ (L6 §3.3 Report reproducible defects)

ส่งใน IG ทีละข้อ ภายใน **25 พ.ย. 12:00**; ทีมคู่เปิด Issue ใน repo เขาแล้วตอบลิงก์

| Our ID | Issue (repo เขา) | Reporter | Tested version | Case / AC | Preconditions / data | Steps | Expected | Actual | Severity + เหตุผล (ผลต่อผู้ใช้) | Defect / feature request | Evidence | ส่งเมื่อ | Triage ของเขา |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | |

ถ้าไม่มี finding: **ไม่มี finding — ทั้ง 7 เคส PASS บน `v0.2.0 / 1cbd8b4 / 00006-8bp`** (แจ้งทีมคู่ใน IG พร้อมหลักฐาน)

เกณฑ์ severity: Critical = ข้อมูลรั่ว/สิทธิ์ผิด/ข้อมูลเสีย; Major = journey หลักทำไม่ได้หรือผลผิด AC; Minor = ไม่กระทบผลลัพธ์ (ข้อความ, layout)

## 5. Retest และผลตัดสิน (L6 §3.4 — กรอก 26 พ.ย.)

| Finding | Version ใหม่ (commit / revision / digest) | เคสที่รันซ้ำ | Tester | วันที่-เวลา | Actual | ผล | Evidence |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

| ผลตัดสิน (เลือกหนึ่ง) | Accepted / Accepted with documented minor limitations / Not Accepted |
|---|---|
| Release ที่ตัดสิน | |
| ผู้ตัดสิน / วันที่ | Paphangkorn Luanseng, Jetanin Naitho / |
| เหตุผล | |
| Minor limitations ที่ยอมรับ (ถ้ามี) | |

ห้าม Accepted ถ้ายังมี critical/major ค้าง หรือมีเคส BLOCKED
