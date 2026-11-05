# Document Change Log

Documentation baseline v0.5 | 5 พฤศจิกายน 2026

| Version | วันที่ | เปลี่ยนแปลง |
|---|---|---|
| 0.1 | 4 พ.ย. 2026 | ร่าง SRS, features/traceability, system design, Sprint plan, contracts/STS/DoD และ evidence templates |
| 0.2 | 4 พ.ย. 2026 | กำหนด React/Express/TypeScript/PostgreSQL/Prisma, Vitest/Supertest และแผน 4 Issues |
| 0.3 | 5 พ.ย. 2026 | ตรวจ PDF ทั้งสองฉบับ; ปรับ metadata, API schemas/UUID และ DEC-06/11/15–17; revise AC-07/15, TEST-08/18/32/36; staging เปลี่ยนจากแผน dev ผ่าน sprint-1 มาเป็น sprint-1-staging |
| 0.4 | 5 พ.ย. 2026 | ย่อข้อความซ้ำ/ประวัติสนทนา; รวม revision history ไว้ที่นี่; ใช้ version เดียวทั้งชุด; แก้ FR-11, feature dependencies/mappings, API schemas/statuses, UI detail route, permission matrix และ STS ให้ตรงกัน โดยคง IDs และขอบเขต features |
| 0.5 | 5 พ.ย. 2026 | ตรวจ PDF/baseline ซ้ำ; ผูก Issues #1–4, assignment และ board/Done; เพิ่ม planned layout; แก้แผน baseline PR เพราะ local Git roots ต่างกัน; ชี้แจง BR-01/04/09/14, error schema/precedence และ AC/STS ที่เกี่ยวข้อง; แก้ traceability และ .gitignore โดยคง IDs |

## Git และ review history

| รายการ | สถานะ |
|---|---|
| v0.2 snapshot | commit `002c6982f40defd42657a2419b0a17329cb34069` วันที่ 4 พ.ย. 2026 |
| v0.1 | ไม่มี Git revision แยกที่ยืนยันได้ |
| v0.3–0.5 | เป็นการแก้ใน working tree ต่อจาก snapshot; รอ commit จริง |
| Teammate review | รอบันทึกใน [Decisions](decisions.md) |
| Application release | ยังไม่มี |

เมื่อเปลี่ยน baseline ให้บันทึกเหตุผล IDs ที่กระทบ และ revision ก่อน implementation เก็บผลทดสอบ/review ตาม commit จริง; การย้ายขอบเขตที่กระทบข้อกำหนดรายวิชาต้องมีการตกลงที่เกี่ยวข้อง

## AI-use declaration

ใช้ Codex ช่วยอ่าน PDF ร่าง/ปรับเอกสาร วิเคราะห์ design และตรวจ IDs/links/traceability ทีมรับผิดชอบตรวจรับและเข้าใจผลลัพธ์ งานปัจจุบันเป็นเอกสาร ยังไม่มี AI-generated application code หรือผลทดสอบแอป
