# Deliverable 2 — Remaining-work list และแผนให้เสร็จภายใน 13 ธ.ค. 2026

Issue #51 | ทีม TH-001_P3 LoungCheu | Jetanin Naitho (`jetanin`, M1), Paphangkorn Luanseng (`i3artuf`, M2) | อัปเดต 27 พ.ย. 2026 (Asia/Bangkok)

ตามที่ D2 §2 และ §3.3 กำหนด รายการนี้ระบุ feature/AC และ defect ที่ยังเหลือ พร้อม owner, dependency, next action และวันที่เสร็จ ก่อนส่งงานสุดท้าย 13 ธ.ค. 2026

## 1. หลักการวางแผน

- **ช่วงสอบ 1–11 ธ.ค. 2026 (D2 §3.3):** ไม่วางงาน implement หลักไว้ในช่วงนี้ ฟีเจอร์ที่เหลือทั้งหมดต้องเสร็จภายใน 30 พ.ย. ส่วน 12–13 ธ.ค. ใช้แค่ final verification, UAT re-test, วิดีโอ และ release
- **สถานะ** ใช้ planned → in progress → implemented → tested → accepted ตามหลักฐานจริงเท่านั้น (ตาม [Sprint 3 contract](../sprints/sprint-3/contracts.md)) contract/STS ไม่นับเป็นผล PASS
- **Accepted** หมายถึงอยู่ใน release ที่ review แล้วบน main ถ้าผ่าน independent UAT ด้วยจะเขียนแยกไว้

## 2. ฐานปัจจุบัน (ทำเสร็จแล้ว — ไม่ใช่งานค้าง)

| Feature / งาน | AC | สถานะ | Tested commit / release |
|---|---|---|---|
| F-01–F-05 (Sprint 1) | AC-01–AC-27 | accepted; UAT โดย TH-005_P5 7/7 PASS, **Accepted** 25 พ.ย. 2026 | `v1.0.1-uat` (`0b2cc80`) |
| F-06 Cancel / re-register / close (Sprint 2) | AC-28–AC-33 | accepted (reviewed release บน main); ยังไม่มี independent UAT | `v2.0.0-sprint-2` (`c0faf24`), CI run 45666007554 |
| F-07 Edit event (Sprint 2) | AC-34–AC-40 | accepted (reviewed release บน main); ยังไม่มี independent UAT | `v2.0.0-sprint-2` (`c0faf24`), CI run 45666007554 |
| Lab 6 controlled exercise LAB6-CX-01 (#64) | AC-13, AC-17, BR-04 | แก้แล้ว release แล้ว และ independent retest **PASS** โดย Nantakorn (TH-005_P5) 26 พ.ย. 2026 19:56–20:28: B1–B5, C1–C3, UAT-02 ผ่าน, Sprint 1 ยังเป็น Accepted (บันทึกใน PR #76) | `v2.0.1-lab6` (`6f49d32`), revision `scccd8b05-00012-msg` |

AC-25 และ AC-27 ของ Sprint 1 ยังเป็น PARTIAL ตาม [traceability](../traceability.md) ดูข้อ 4

## 3. Remaining features และ AC

| Feature / defect | สถานะปัจจุบัน (AC ที่ได้ + tested commit) | Remaining action (AC / verification / fix ที่ขาด) | Dependency | Owner; วันที่เสร็จ |
|---|---|---|---|---|
| **F-08 Check-in และ own attendance** (#50) | **accepted (release)**: AC-41–AC-46 ผ่าน TEST-53–59, TEST-65–66; PR #78, #79, #80; release `v3.0.0-sprint-3` (`3f80759`) 27 พ.ย. และตรวจบน deployment แล้ว | ไม่มีงาน implement ที่เหลือ; รวมใน final verification 12 ธ.ค. | — | Jetanin; เสร็จ 27 พ.ย. |
| **F-09 Attendance summary** (#74) | **accepted (release)**: AC-47–AC-50 ผ่าน TEST-60–64 รวมการเช็กชื่อจริงของ F-08; PR #75; release `v3.0.0-sprint-3` (`3f80759`) 27 พ.ย. และตรวจบน deployment แล้ว | ไม่มีงาน implement ที่เหลือ; รวมใน final verification 12 ธ.ค. | — | Paphangkorn; เสร็จ 27 พ.ย. |
| **Sprint 3 release** | **เสร็จ**: PR #81 merge 27 พ.ย. 18:58 → `3f80759`, deploy revision `scccd8b05-00013-nwj`, `/api/ready` ตรง, tag `v3.0.0-sprint-3`; post-deploy check 19/19 PASS รวมตรวจ redeploy persistence ซ้ำ ([หลักฐาน](../sprints/sprint-3/evidence/release-v3.0.0/README.md)) | ใช้ tag นี้เป็นเวอร์ชันของ D2 | — | Jetanin (merge) / Paphangkorn (PR, verification); เสร็จ 27 พ.ย. |
| **LAB6-CX-01** retest (#64, #44) | **เสร็จ**: RED `fe31120` → GREEN `37d5be4`, release `v2.0.1-lab6`; retest PASS 26 พ.ย. (Nantakorn); หลักฐานใน PR #76 (merge แล้ว); #44 และ #64 ปิดแล้ว | — | — | Jetanin; เสร็จ 27 พ.ย. |

ตอนนี้ไม่มี defect จริงที่ยังเปิดอยู่: UAT ของ Sprint 1 ไม่พบ finding (EV-D-01) ส่วน LAB6-CX-01 เป็น defect ที่ TA กำหนดให้ทำเป็นแบบฝึกหัด และแก้แล้ว

## 4. Verification ที่ยังค้าง (coverage gaps)

สถานะใช้คำตาม [traceability](../traceability.md) (Tested — PASS, Partial verification, Not executed ฯลฯ); tested version ปัจจุบันคือ `v3.0.0-sprint-3` (`3f80759`) ทะเบียน change/defect อยู่ใน [change-register.md](change-register.md)

| ID | สถานะปัจจุบัน (ที่ผ่านแล้ว + tested version) | ที่ยังขาด | Remaining action | Dependency | Owner; วันที่เสร็จ |
|---|---|---|---|---|---|
| GAP-02 / AC-25 / NFR-03 (TEST-31, TEST-35) | **Partial verification.** TEST-31 ส่วน restart — PASS: TEST-43/TEST-66 compiled restart บน DB เดิม (regression `3f80759`); Lab 5 #20 Cloud Run restart + redeploy (`scccd8b05-00005-5xj` → `scccd8b05-00006-68j`, 22 พ.ย.); Sprint 3 migration + redeploy อ่าน event `L5-C05-20261122-A` / registration `dd47235f-…` กลับด้วย ID เดิม (`scccd8b05-00013-nwj`, 27 พ.ย., [post-deploy](../sprints/sprint-3/evidence/release-v3.0.0/README.md)) | TEST-35: teammate ที่ไม่ใช่ผู้พัฒนาติดตั้งจาก README บนเครื่อง/DB ใหม่ — Not executed | ทำ TEST-35 (แถวถัดไป) แล้วตัดสินปิด GAP-02 พร้อมบันทึก tester/date/commands/commit | TEST-35 | Paphangkorn; 12 ธ.ค. |
| NFR-05 / TEST-35 clean reproduction | **Partial verification.** `npm ci` → migrate → typecheck/test/build/Docker build ผ่านใน CI บนเครื่องใหม่ทุก run (ล่าสุด `3f80759`) | การทำตาม README ด้วยมือโดย teammate บนเครื่อง/DB ใหม่ — Not executed | ทำตาม README: install → migrate → seed → test → run บันทึก tester/date/commands/result/commit | README ปัจจุบัน (Jetanin ดูแล) | Paphangkorn; 12 ธ.ค. |
| NFR-02 cookie บน HTTPS จริง | **Tested — PASS** 27 พ.ย. 2026 บน `3f80759`: `HttpOnly; Secure; SameSite=Lax`, Expires +2 ชม. ([หลักฐาน](../sprints/sprint-3/evidence/nfr02-https-cookie/README.md)) | (ไม่บังคับ) ดู cookie หลัง login ใน browser จริง | DevTools → Application → Cookies หลัง login, ไม่แคปค่า cookie | credentials ส่วนตัว | Paphangkorn; 30 พ.ย. |
| NFR-06 browser/device matrix | **Partial verification.** automated UI/Chromium 41/41 บน `3f80759` (รวม 1280/390/320 px) | manual desktop + mobile matrix — Not executed | รันเคสหลักบน desktop + mobile อย่างละ 1 browser บน release สุดท้าย | final release | Jetanin + Paphangkorn; 12 ธ.ค. |
| AC-27 / NFR-08 process acceptance (TEST-34) | **Partial verification.** reviewed releases บน main: PR #12, #67, #81; ทุก feature PR มี teammate review + CI | final TEST-34 audit — Not executed | audit AC/test refs, TDD, Issue/PR chains, releases และ limitations ทั้งชุด | แถวข้างบนทั้งหมด | Paphangkorn; 12 ธ.ค. |
| NFR-09 independent UAT ของ Sprint 2–3 | Sprint 1: Accepted by independent UAT (`v1.0.1-uat`, 25 พ.ย.); LAB6-CX-01 retest PASS (26 พ.ย.); Sprint 2–3: **Not executed** | UAT ของ F-06–F-09 | ตาม [#95](https://github.com/jetanin/LoungCheu/issues/95) (Final-D): ตกลง independent testers/รอบทดสอบภายใน 30 พ.ย.; แจก case/version/fixtures; reuse UAT Sprint 1 + journey ที่เปลี่ยนใน Lab 7 และเพิ่ม S2 cancel/reactivate/close/edit, S3 check-in/summary; บันทึก tester/date/version/result | ทีมทดสอบยืนยันนัด; final candidate freeze | Paphangkorn (reviewer Jetanin); ตกลงภายใน 30 พ.ย., รัน ≤ 12 ธ.ค. |
| CHG-06 browser timeout ที่เกิดเป็นครั้งคราว (F-06 TEST-43) | เกิด 1 ครั้งบนเครื่อง local หาสาเหตุไม่ได้; CI release `3f80759` ผ่าน 41/41 | root cause | เฝ้าดูใน CI ถ้าเกิดซ้ำให้เปิด issue พร้อม log ห้ามลด assertion | — | Jetanin; ต่อเนื่องถึง 13 ธ.ค. |
| CHG-07 Lab 7 change request (CR-01, BR-01) | **Planned** — CR DRAFT ใน #84 | ยืนยัน CR, reviewed contract, RED/GREEN, release, deployed re-test | ยืนยัน CR + review contract PR (#84) → API #85 / UI #86 → release #87 → metrics #88 → PDF #89 | contract #84 ผ่าน review ก่อน #85/#86 | #84/#86/#88 Paphangkorn, #85/#87/#89 Jetanin; ส่ง Lab 7 29 พ.ย. 23:59 |

ข้อจำกัดที่เปิดเผยไว้ แต่แก้ย้อนหลังไม่ได้: output ของ F-07 RED commit `ef94a3f`/`1fd71db` ไม่ได้เก็บไว้ตอนรัน ดู [Sprint 2 completion](../sprints/sprint-2/README.md)

## 5. แผนตามวันที่ถึง 13 ธ.ค. 2026

| วันที่ | งาน | Owner |
|---|---|---|
| 27 พ.ย. | **เสร็จแล้ว:** PR นี้ (#73) และ PR #76 merge, #64/#44 ปิด; F-08 (PR #78, #79, #80) และ F-09 (PR #75) merge เข้า `sprint-3-staging`; release `v3.0.0-sprint-3` (PR #81) + deploy + post-deploy 19/19 PASS รวม GAP-02 redeploy readback | Jetanin, Paphangkorn |
| 28 พ.ย. | (งานที่วางไว้ — F-08/F-09 merge, release candidate บน main + deploy + tag — เสร็จก่อนกำหนดแล้วเมื่อ 27 พ.ย.) ประกอบ D2 PDF | Paphangkorn |
| 28–29 พ.ย. | Lab 7: ยืนยัน CR-01 และ review contract (#84) ก่อนโค้ด → API/UI (#85, #86) → release + deployed re-test (#87) → metrics (#88) → PDF (#89) | Jetanin, Paphangkorn |
| 29 พ.ย. | ส่ง Lab 6 PDF (#45), D2 PDF (#51) และ Lab 7 PDF (#89) ภายใน 23:59 | Jetanin (#45, #89), Paphangkorn (#51) |
| 30 พ.ย. | ตกลง independent testers/รอบ UAT Final (#95); (ไม่บังคับ) ยืนยัน cookie หลัง login — NFR-02 attributes ตรวจผ่านแล้ว 27 พ.ย. | Paphangkorn |
| 1–11 ธ.ค. | ช่วงสอบ — ไม่ทำงาน implement; แก้แค่ defect ร้ายแรงถ้ามี | — |
| 12 ธ.ค. | Clean reproduction (TEST-35, Paphangkorn), browser/device matrix, independent UAT + re-test ของ final candidate (#95), audit traceability ขั้นสุดท้าย, อัดวิดีโอ | Jetanin, Paphangkorn |
| 13 ธ.ค. | Final release บน main + deploy + tag, ส่งงาน | Jetanin, Paphangkorn |

Lab 7 (change request): CR-01 ร่างแล้วใน [#84](https://github.com/jetanin/LoungCheu/issues/84): ชื่อกิจกรรมยาวอย่างน้อย 3 ตัวอักษร (BR-01) — สถานะ DRAFT รอทั้งคู่ยืนยัน CR และ jetanin review contract PR ก่อนเขียน test/โค้ด; งานต่อไป #85 API (Jetanin), #86 UI (Paphangkorn), #87 integrate/release/deploy (Jetanin), #88 metrics (Paphangkorn), #89 readiness/PDF (Jetanin); กำหนดส่ง Lab 7 29 พ.ย. 2026 23:59. ข้อกำหนดจาก TA (EV-TA-01): ต้องเปลี่ยนกฎหรือพฤติกรรมที่มีอยู่แล้วใน Sprint 1 และห้ามใช้ LAB6-CX-01 เป็น change request. Independent UAT รอบ Final ดู #95
