# Part B — Feature Inventory

Documentation baseline v0.5 | 5 พฤศจิกายน 2026 | Execution update 6 พ.ย.: F-01 รวม staging แล้ว; F-02 implement/test บน feature/events รอ review/integration/release ดู [verification](events/verification.md); F-03–09 ยังไม่รวมใน branch นี้

| ID | Feature / ผลลัพธ์ | Requirement / Rules | Dependency | Sprint |
|---|---|---|---|---:|
| F-01 | Login, identity และ Logout สำหรับ demo users | FR-01–02; BR-06–07; NFR-01–02 | Seed users, session store | 1 |
| F-02 | สร้าง/เผยแพร่กิจกรรม ดูกิจกรรมที่เผยแพร่ และรายการกิจกรรมของผู้จัด | FR-03–05, FR-08 ส่วนรายการกิจกรรม; BR-01–02,07,09,11,14 | F-01 | 1 |
| F-03 | ลงทะเบียนโดยคุม duplicate, deadline และ capacity | FR-06; BR-03–07,10,14; NFR-04 | F-01, F-02 | 1 |
| F-04 | ดูรายการและรายละเอียด registration ของตน; เพิ่มสถานะ check-in ผ่าน F-08 ใน S3 | FR-07; BR-06 | F-03 | 1 |
| F-05 | ดู roster และ ACTIVE count ของกิจกรรมตน | FR-08 ส่วน roster; BR-07 | F-02, F-03 | 1 |
| F-06 | ยกเลิก ลงทะเบียนใหม่ และปิดรับกิจกรรม | FR-09–10,12; BR-03–11,14 | F-03–05 | 2 |
| F-07 | แก้รายละเอียดและปรับความจุแบบไม่ทำให้ข้อมูลผิดกฎ | FR-11; BR-01–02,07,10–11,14 | F-02, F-03 | 2 |
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

Sprint ของ F-04 คือการสร้าง capability เริ่มต้น; FR-14 อยู่ใน F-08/S3 ซึ่งขยายหน้าเดิม Allocation ราย FR/BR/NFR ฉบับเต็มอยู่ใน [Traceability](traceability.md); ตารางนี้สรุป requirement หลัก
