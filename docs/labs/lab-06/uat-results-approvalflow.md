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
| Image (00006-8bp) | `asia-southeast1-docker.pkg.dev/cpe334-approvalflow-10151028/approvalflow/approvalflow@sha256:7769a17259d37491eae97001f3d08dad5fc694c606b76d7c51ba22933249c8ea` | ทีมคู่แจ้งทาง IG 24 พ.ย. (EV-B-00d) |
| ตรวจ digest (เรา) | ตรงกับ build ของ `1cbd8b4`: ใน Actions run [45027845625](https://github.com/AlphabetCG/approvalflow/actions/runs/45027845625) (push `1cbd8b4` เข้า main) step #27 `exporting manifest sha256:7769a172…c8ea` และ `exporting manifest list sha256:20984f2b…49cf` — `20984f2b…` ที่ handoff ระบุคือ manifest list ของ build เดียวกัน (CI deploy ด้วย digest นี้เป็น 00005-8rh); 00006-8bp ชี้ manifest ของ platform `7769a172…` จึงเป็น image เดียวกัน | ตรวจจาก log Actions 24 พ.ย. |
| Runtime config ของ 00006-8bp | env `NODE_ENV`, `TZ=Asia/Bangkok`; secret `DATABASE_URL`; max instances 3; ทีมคู่ยืนยันว่าตอนสร้าง 00006-8bp **ไม่ได้เปลี่ยนค่าใด แค่ redeploy** | IG 24 พ.ย. (EV-B-00c, EV-B-00d) |
| Version freeze | ทีมคู่ยืนยันว่าจะไม่ deploy และไม่แก้ Cloud Run จนถึง 25 พ.ย. 12:00 | IG 24 พ.ย. (EV-B-00c) |
| Handoff ที่ได้รับ | ทีมคู่ส่งทาง IG กลุ่ม 24 พ.ย. 11:35 (ก่อนกำหนด 12:00): ระบุ v0.2.0 / 1cbd8b4 / revision `00006-8rh` และลิงก์ `blob/staging/…/uat-handoff.md` ที่ยังเปิดไม่ได้ → เป็นที่มาของ Q1/Q2 | EV-B-00 |
| Sprint 1 baseline | `v0.1.0` (PR #18); v0.1.0 → v0.2.0 เปลี่ยนเฉพาะ delivery + ข้อความหน้าแรก 1 ประโยค | handoff §1 |
| วิธีเช็ก version | แอปไม่มี version endpoint — ทีมคู่สัญญาประกาศทุก deploy ใน IG; ไม่มีประกาศ deploy ระหว่างที่เราทดสอบ `<ยืนยันตอนจบ>` | handoff §1 |

Tested version ที่ใช้ทุกแถวด้านล่าง: **`v0.2.0 / 1cbd8b4 / approvalflow-00006-8bp`**

## 2. คำถามที่ถามทีมคู่ก่อนรัน (L6 §3.3 Reproduce and clarify)

| # | คำถาม (24 พ.ย.) | คำตอบ | หลักฐาน |
|---|---|---|---|
| Q1 | ใช้ไฟล์ใน branch `docs/lab6-uat` เป็นฉบับทางการได้ไหม | ได้ | EV-B-00a |
| Q2 | revision จริง 00006-8rh หรือ 00006-8bp | ตอบแรกว่า "น่าจะ bp ก็อปผิด"; ยืนยันในข้อความ digest ว่าเป็น 00006-8bp (00005-8rh คือ revision แรกของ image เดียวกัน) | EV-B-00a, EV-B-00b |
| Q3 | image digest | ครั้งแรก 2 ข้อความเป็น placeholder; ถามซ้ำแล้วได้ `sha256:7769a172…c8ea` — เราตรวจกับ log Actions แล้วเป็น manifest ของ build `1cbd8b4` (ดู §1) | EV-B-00b, EV-B-00c, EV-B-00d |
| Q4 | ตั้งค่าอะไรใน Console (env/secret/scaling) | ไม่ได้เปลี่ยนค่าใด แค่ redeploy image เดิม; config: NODE_ENV, TZ=Asia/Bangkok, secret DATABASE_URL, max instances 3 | EV-B-00c, EV-B-00d |
| Q5 | (24 พ.ย. ระหว่างรัน) UAT-01 step 5 expected "listed with status SUBMITTED" แต่ Review queue ไม่มีคอลัมน์ Status หมายถึงอะไร | หมายถึงคิวแสดงเฉพาะคำขอ SUBMITTED ที่ assign ให้ reviewer เรียงเก่า→ใหม่; ไม่มีคอลัมน์ Status โดยตั้งใจตาม contract F-04; expected เขียนกำกวม; step 5 ถือว่า PASS; ถ้าต้องการคอลัมน์ Status ให้ส่งเป็น feature request (เราไม่ส่ง — ไม่อยู่ใน Sprint 1 scope) | EV-B-00e |

## 3. ผลการรัน (L6 §3.2)

วิธีบันทึก: tester แต่ละคนรันเคสของตัวเองและแคปภาพเอง; M2 เป็นผู้บันทึกไฟล์นี้คนเดียว — แถว UAT-04/05/06 คัดจากรายงานของ M1 (Jetanin): ไฟล์ผล + ภาพ 19 ภาพที่ M1 ส่งให้ M2 (ได้รับ 25 พ.ย. 00:29) — M2 ตรวจ actual เทียบภาพทุกภาพและ SHA-256 ของภาพตรงกับที่ M1 แนบ; M1 ตรวจความถูกต้องใน PR review

Prefix ข้อมูลของเรา: `UAT-P3-<เคส>` | Actual = สิ่งที่หน้าจอแสดงจริง ห้ามคัด expected | ทุกเคสที่มีการปฏิเสธ แคป 2 ภาพ (การปฏิเสธ + สถานะที่ไม่เปลี่ยน)

| Case | หมวด | Tester / team | วันที่-เวลา (Bangkok) | Tested version | Inputs ที่ใช้จริง | Actual result | PASS / FAIL / BLOCKED | Evidence ID |
|---|---|---|---|---|---|---|---|---|
| UAT-01 | Normal journey | Paphangkorn / TH-001_P3 | 24 พ.ย. 2026 18:54–19:02 | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG1 (Anan) → reviewer ที่ระบบเลือก **rev.eng1 (Chai)** → REQ-ENG1; `UAT-P3-01 Team lunch`, Training, `1500.50`, `Lunch for the onboarding workshop`; comment `Within budget` | (1) header "Anan (Engineering requester) · Requester" เมนู My requests / New request ไม่มี Review queue (2) "Request submitted. Status: SUBMITTED. Reviewer: rev.eng1@example.com." (3) My requests แถวแรก UAT-P3-01 Team lunch, Training, 1,500.50, SUBMITTED, 24 Nov 18:55, Chai (Engineering reviewer) (4) รายละเอียด Amount 1,500.50, Reviewer Chai (rev.eng1@example.com), History 1 รายการ "Submitted by Anan … – → SUBMITTED · 18:55" ไม่มีส่วน Decision (5) Chai · Reviewer: Review queue มี UAT-P3-01 (เรียงเก่า→ใหม่: 21 Nov 16:37, 16:58, UAT-P3-02 min 18:50, UAT-P3-01 18:55) ทุกแถวเป็นของ Chai; **ตารางไม่มีคอลัมน์ Status** (6) "Request approved." Status APPROVED, History ข้อ 2 "Approved by Chai … SUBMITTED → APPROVED · 19:00 Comment: Within budget" ไม่มีส่วน Decision (7) Review queue ไม่มี UAT-P3-01 แล้ว (8) Anan: My requests แถว UAT-P3-01 = APPROVED, Chai; เปิดรายละเอียด (แคปเพิ่ม 19:29, อ่านอย่างเดียว) Status APPROVED, History 1. Submitted by Anan 18:55 2. Approved by Chai 19:00 Comment: Within budget | PASS — step 5: คิวไม่มีคอลัมน์ Status; ทีมคู่ยืนยันว่า expected เขียนกำกวม คิวแสดงเฉพาะ SUBMITTED ที่ assign ให้ reviewer เรียงเก่า→ใหม่ ตาม contract F-04 (D-15 และตาราง UI "Queue, loaded" ที่ v0.2.0 ไม่มี Status) — เราตรวจ contract แล้วตรง; status SUBMITTED ยืนยันจากหน้ารายละเอียด (EV-B-16) ดู §2 Q5 | EV-B-13 – EV-B-20, EV-B-20b |
| UAT-02 | Boundary (amount) | Paphangkorn / TH-001_P3 | 24 พ.ย. 2026 18:45–18:52 | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG2 (Busaba); Supplies, `Boundary test`; `UAT-P3-02 zero` + `0` → `100000.01` → `12.345` → title ว่าง + `10`; `UAT-P3-02 min` + `0.01`; `UAT-P3-02 max` + `100000` | (1) ฟอร์ม New request ว่าง (2) ช่อง Amount ขอบแดง ข้อความ "Amount must be greater than 0" ไม่มีข้อความสำเร็จ (3) "Amount must be at most 100000" (4) "Amount must have at most 2 decimal places" (5) ช่อง Title ขอบแดง "Title is required"; Category Supplies, Amount 10, Description Boundary test ยังอยู่ (6) กล่องเขียว "Request submitted. Status: SUBMITTED. Reviewer: rev.eng1@example.com." ฟอร์มถูกล้าง (7) "Request submitted. Status: SUBMITTED. Reviewer: rev.eng2@example.com." (8) My requests: `UAT-P3-02 max` 100,000.00 (18:51, Duangjai) อยู่บน `UAT-P3-02 min` 0.01 (18:50, Chai) ทั้งคู่ SUBMITTED; ไม่มีรายการ zero/ที่ถูกปฏิเสธ (อีกแถวคือข้อมูลเดิม 21 Nov ของทีมคู่) | PASS | EV-B-06 – EV-B-12 |
| UAT-03 | Business rule (reject reason) | Paphangkorn / TH-001_P3 | 24 พ.ย. 2026 19:05–19:10 | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-FIN1 (Ekachai) → reviewer ที่ระบบเลือก **rev.fin2 (Ganya)** → REQ-FIN1; `UAT-P3-03 Taxi`, Travel, `350`, `Airport taxi`; reason `No budget` (9) → เว้นวรรค 3 ตัว → `No budget left` (14) | (1) "Request submitted. Status: SUBMITTED. Reviewer: rev.fin2@example.com." (2) Ganya · Reviewer เปิดคำขอ เห็นส่วน Decision (Approve/Reject) (3) ช่องขอบแดง "A rejection needs a reason of at least 10 characters", Status SUBMITTED; หลัง reload Status SUBMITTED และยังมีส่วน Decision (4) ช่องว่าง ขอบแดง ข้อความเดียวกัน Status SUBMITTED (5) "Request rejected." Status REJECTED, History 1. Submitted by Ekachai 19:05 2. Rejected by Ganya … SUBMITTED → REJECTED · 19:08 Reason: No budget left — มีเพียง 2 รายการ แสดงว่าการ reject ที่ถูกปฏิเสธในข้อ 3–4 ไม่เพิ่ม history (ภาพข้อ 3–4 รายการ History อยู่นอกกรอบภาพ) (6) Ekachai · Requester: Status REJECTED, History แสดง "Reason: No budget left" | PASS | EV-B-21 – EV-B-26 (rejection: EV-B-22 + EV-B-23) |
| UAT-04 | Forbidden role / ownership | Jetanin / TH-001_P3 | 24 พ.ย. 2026 22:50–23:17 | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG1 (Anan) → reviewer ที่ระบบเลือก **rev.eng2 (Duangjai)**; REQ-FIN1 (Ekachai); REV-FIN1 (Fah); `UAT-P3-04 Monitor`, Equipment, `5900`, `Second screen`; URL `/requests/cmwuvfgnq0001s6010rwln7h3`, แก้ท้าย `…7h3` → `…7h4` | (1) "Request submitted. Status: SUBMITTED. Reviewer: rev.eng2@example.com."; รายละเอียด SUBMITTED, 5,900.00, History 1 รายการ "Submitted by Anan … – → SUBMITTED · 22:50" (2) Ekachai เปิด URL เดิม: "Request not found." ไม่มีชื่อ/จำนวนเงิน/คำอธิบาย/History (3) header Ekachai · Requester มีแค่ My requests / New request; เปิด `/reviews`: หัวข้อ Review queue ข้อความแดง "Requires role REVIEWER" ไม่มีตาราง (4) URL `…7h4`: "Request not found." หน้าเดียวกับข้อ 2 (5) Fah · Reviewer เปิด URL เดิม: "Request not found." ไม่มีส่วน Decision (6) Review queue ของ Fah มีแค่ Accounting software training (21 Nov) ไม่มี UAT-P3-04 (7) Duangjai เปิดคำขอ: Status SUBMITTED ข้อมูลเดิมทุกช่อง History ยังมีแค่ Submitted 22:50 (มีส่วน Decision เพราะเป็น reviewer ที่ได้รับมอบหมาย — ไม่ได้ตัดสิน) | PASS | EV-B-40 – EV-B-48 (rejection: EV-B-42/44/45/46 + สถานะไม่เปลี่ยน EV-B-48 เทียบ EV-B-41) |
| UAT-05 | Forbidden (reviewer own request) | Jetanin / TH-001_P3 | 24 พ.ย. 2026 23:34–23:36 | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REV-ENG1 (Chai) → REV-ENG2 (Duangjai); `UAT-P3-05 Keyboard`, Equipment, `990`, `Replacement keyboard` | (1) Chai · Reviewer: "Request submitted. Status: SUBMITTED. Reviewer: rev.eng2@example.com." (2) รายละเอียด Requester Chai (rev.eng1), Reviewer Duangjai (rev.eng2), SUBMITTED, **ไม่มีส่วน Decision** History 1 รายการ Submitted by Chai 23:34 (3) Review queue ของ Chai: Conference travel to Chiang Mai, Test, UAT-P3-02 min — ไม่มี UAT-P3-05 (4) Review queue ของ Duangjai มีแถว UAT-P3-05 Keyboard, Chai, Equipment, 990.00, 24 Nov 23:34; เปิดรายละเอียดยัง SUBMITTED History 1 รายการเดิม | PASS | EV-B-50 – EV-B-54 (rejection: EV-B-51 + EV-B-52; สถานะไม่เปลี่ยน EV-B-54) |
| UAT-06 | State / history / persistence | Jetanin / TH-001_P3 | 24 พ.ย. 2026 23:30–23:32 | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG2 (Busaba) → reviewer ที่ระบบเลือก **rev.eng2 (Duangjai)**; `UAT-P3-06 Course`, Training, `2400`, `Online course`; แท็บ A comment `OK for Q4`; แท็บ B reason `Changed my mind` (ภาพไม่แสดง; M1 ยืนยัน 25 พ.ย.) | (1) "Request submitted. Status: SUBMITTED. Reviewer: rev.eng2@example.com." (2) เปิดคำขอ 2 แท็บ (ไม่มีภาพก่อนตัดสิน — เคสไม่บังคับ) (3) แท็บ A: "Request approved." Status APPROVED, History 2. Approved by Duangjai SUBMITTED → APPROVED · 23:31 Comment: OK for Q4 (4) แท็บ B: ข้อความแดง "This request is already APPROVED" Status APPROVED ไม่มีส่วน Decision (ข้อความนี้ยืนยันว่าแท็บ B ส่ง Reject จากหน้าเดิมโดยไม่ได้ refresh) (5) หลัง reload แท็บ B: ข้อความแดงหายไป Status APPROVED History มี 2 รายการ Submitted 23:30, Approved 23:31 (OK for Q4) ไม่มี Rejected (6) Busaba · Requester: APPROVED History 2 รายการเดิม เรียงเก่า→ใหม่ แต่ละรายการมีผู้ทำ, from → to และเวลา | PASS | EV-B-60 – EV-B-64 (rejection: EV-B-62 + สถานะไม่เปลี่ยน EV-B-63/64) |
| UAT-07 | Sign-in / session | Paphangkorn / TH-001_P3 | 24 พ.ย. 2026 18:37–18:43; step 5 ทำซ้ำ 19:16 เพื่อเก็บภาพหลัง reload | `v0.2.0 / 1cbd8b4 / 00006-8bp` | REQ-ENG1; ไม่ login เปิด `/requests`; `req.eng1@example.com` + `wrong-password-1`; `nobody@example.com` + รหัสสุ่ม; ` REQ.ENG1@Example.com ` + รหัสจริง | (1) URL `/requests` แสดงฟอร์ม Email/Password/Sign in ไม่เห็นรายการคำขอ (2) ข้อความแดง "Email or password is incorrect", ช่อง email ยังเป็น req.eng1@example.com, ช่องรหัสว่าง (3) ข้อความเดียวกันทุกตัวอักษร, email nobody@example.com ยังอยู่ (4) เข้าสู่ `/requests` header "Anan (Engineering requester) · Requester", เมนูมี My requests / New request ไม่มี Review queue (5) Sign out → Back → reload: URL `/requests` แสดงฟอร์ม Sign in ไม่เห็น My requests (รอบ 18:43 ก่อน reload ก็อยู่หน้า Sign in) | PASS (tester ยืนยันว่า step 4 พิมพ์ email มีเว้นวรรค+ตัวพิมพ์ใหญ่ตามเคส) | EV-B-01 – EV-B-05 |
| **รวม** | | | | | | | PASS `7` / FAIL `0` / BLOCKED `0` | |

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
