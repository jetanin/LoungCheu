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

| Gap | สถานะปัจจุบัน | Remaining action | Owner; วันที่เสร็จ |
|---|---|---|---|
| GAP-02 / AC-25 / NFR-03 / TEST-31 | PARTIAL: recreate app (S1) และ backend process restart บน DB เดิม (F-06 TEST-43, CI) ผ่าน; Lab 5 (#20, 22 พ.ย. 2026) ตรวจบน Cloud Run แล้ว: event `L5-C05-20261122-A` และ registration `dd47235f-be9f-46ed-830a-4d49586cf1e2` (ACTIVE, 4/5) ยังอยู่ครบหลัง application restart บน revision `scccd8b05-00005-5xj` และหลัง redeploy ไป revision ใหม่ `scccd8b05-00006-68j` ([หลักฐาน](../labs/lab-05/evidence/issue20-persistence-20261122/README.md)). หลักฐานนี้เป็นของ release เดิม จึงไม่ประกาศปิด GAP-02 จากหลักฐานนี้อย่างเดียว | ตรวจซ้ำสำหรับ release ใหม่ของ Sprint 3: จด ID ของ event/registration เดิมก่อน deploy → deploy → อ่านกลับผ่าน API/UI ด้วย ID เดิม บันทึก revision ก่อน/หลัง | Paphangkorn; 30 พ.ย. (ทำพร้อม Sprint 3 deploy) |
| NFR-05 / TEST-35 clean reproduction | PARTIAL: Docker build ผ่านใน CI; ยังไม่มี tester/date/commands จากเครื่องใหม่ | อีกคนในทีมทำตาม README บนเครื่อง/DB ใหม่: install → migrate → seed → test → run บันทึกผล | Paphangkorn (README อัปเดตโดย Jetanin ตามแผน D2 6.14 จึงให้อีกคนเป็นผู้ทดสอบ); 12 ธ.ค. |
| NFR-02 cookie บน HTTPS จริง | NOT EXECUTED บน deployment | ตรวจ `Set-Cookie` (Secure/HttpOnly/SameSite) จาก URL Cloud Run แล้วบันทึก | Paphangkorn; 30 พ.ย. |
| NFR-06 independent browser/device matrix | automated UI coverage ผ่าน; manual matrix ยังไม่ครบ | รันเคสหลักบน desktop + mobile อย่างละ 1 browser บน release สุดท้าย | Jetanin + Paphangkorn; 12 ธ.ค. |
| AC-27 / NFR-08 process acceptance | PARTIAL: เอกสารยังอ้างหลักฐานถึง Sprint 1 staging | อัปเดต traceability ให้อ้าง reviewed main releases (`v1.0.0-sprint-1`, `v1.0.1-uat`, `v2.0.0-sprint-2`) และ audit ขั้นสุดท้าย | Paphangkorn; 12 ธ.ค. |
| Independent UAT ของ Sprint 2–3 | ยังไม่มี (UAT ของ Lab 6 ครอบคลุมแค่ Sprint 1) | ทำตาม Lab 7 / การทดสอบสุดท้ายที่อาจารย์กำหนด แล้วบันทึกผลกับ release ที่ทดสอบ | ทั้งทีม; ตามกำหนดของ Lab 7 |
| Browser timeout ที่เกิดเป็นครั้งคราว (F-06) | เคยเกิด 1 ครั้งในเครื่อง หาสาเหตุไม่ได้; CI ตอน release ผ่าน 39/39 | เฝ้าดูใน CI ถ้าเกิดซ้ำให้เปิด issue พร้อม log ห้ามลด assertion | Jetanin; ต่อเนื่องถึง 13 ธ.ค. |

ข้อจำกัดที่เปิดเผยไว้ แต่แก้ย้อนหลังไม่ได้: output ของ F-07 RED commit `ef94a3f`/`1fd71db` ไม่ได้เก็บไว้ตอนรัน ดู [Sprint 2 completion](../sprints/sprint-2/README.md)

## 5. แผนตามวันที่ถึง 13 ธ.ค. 2026

| วันที่ | งาน | Owner |
|---|---|---|
| 27 พ.ย. | merge PR นี้ และ PR #76 (ผล retest LAB6-CX-01) แล้วปิด #64/#44 (PR #71 และ #72 merge แล้ว 26 พ.ย.); F-08 migration ขึ้น `sprint-3-staging`; F-08 RED; F-09 UI (TEST-64) | Jetanin, Paphangkorn |
| 28 พ.ย. | F-08 กฎแรก GREEN; F-09 ครบ AC-47–AC-50 merge เข้า staging; release candidate ของ D2 บน main + deploy + tag | Jetanin, Paphangkorn |
| 29 พ.ย. | ส่ง Lab 6 PDF (#45) และ D2 PDF (#51) ภายใน 23:59 | Jetanin (#45), Paphangkorn (#51) |
| 30 พ.ย. | NFR-02 (deployed HTTPS cookie check) — F-08/F-09 และ release `v3.0.0-sprint-3` เสร็จก่อนกำหนดแล้วเมื่อ 27 พ.ย. | Jetanin, Paphangkorn |
| 1–11 ธ.ค. | ช่วงสอบ — ไม่ทำงาน implement; แก้แค่ defect ร้ายแรงถ้ามี | — |
| 12 ธ.ค. | Clean reproduction (TEST-35, Paphangkorn), browser/device matrix, UAT re-test (ถ้ามี), audit traceability ขั้นสุดท้าย, อัดวิดีโอ | Jetanin, Paphangkorn |
| 13 ธ.ค. | Final release บน main + deploy + tag, ส่งงาน | Jetanin, Paphangkorn |

Lab 7 (change request) ยังไม่ได้ใส่วันที่ในตาราง จะเพิ่มตามกำหนดใน handout ของ Lab 7. ข้อกำหนดที่ทราบแล้วจาก TA (EV-TA-01): ต้องเปลี่ยนกฎหรือพฤติกรรมที่มีอยู่แล้วใน Sprint 1 และห้ามใช้ LAB6-CX-01 เป็น change request
