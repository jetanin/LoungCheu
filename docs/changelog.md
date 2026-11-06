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
| v0.3–0.5 | บันทึกใน documentation history ถึง `f5339b9`; baseline merge เข้า staging `5395942` ผ่าน PR #5 |
| Teammate review | jetanin APPROVED baseline v0.5; รายละเอียด/วันที่/ลิงก์ใน [Decisions](decisions.md) |
| Setup/F-01 — 6 พ.ย. 2026 | Working tree บน `feature/auth` จาก `5395942`; ยังไม่ commit/push/เปิด feature PR; ผลรันและ SHA256 source versions อยู่ใน [auth evidence](deliverable-1/evidence/auth/README.md) |
| F-01 pre-PR review — 6 พ.ย. 2026 | แก้ session-response race/page restore, JSON charset 400, DB URL/test target validation, SPA fallback ใน hidden ancestor, session cleanup และ fixture isolation; current 54 unit/API + 7 browser PASS; clean dependency install/build/smoke ตรวจจริง ดู [pre-PR review](sprints/sprint-1/auth-pre-pr-review.md); ไม่เปลี่ยน AC baseline และไม่อ้าง teammate approval |
| Layout/local DB — 6 พ.ย. 2026 | ผู้ใช้ยืนยัน `server/client`; ปรับ workspace names/scripts/imports/config/ignore/lockfile/docs และทดสอบซ้ำ 54 unit/API + 7 browser PASS พร้อม typecheck/build/compiled smoke; app DB ใหม่ `loung-cheu-database` ยังรอ role authentication จึงยังไม่ migrate/seed ดู [record](sprints/sprint-1/server-client-local-db.md) |
| App DB migration/env cleanup — 6 พ.ย. 2026 | ผู้ใช้แก้ connection แล้วและสั่งรัน: migrate `202611060001_auth`/seed บน `loung-cheu-database` สำเร็จ, เพิ่ม `test:local-db` ตรวจ actual app DB และสอง-role auth lifecycle, rerun suites/build/typecheck; ลบ root `.env.example` ที่ซ้ำ เก็บ `server/.env` กับ root `.env.test` แยกหน้าที่ รหัส demo อยู่เฉพาะไฟล์ local; ผลก่อนหน้านี้เป็น historical evidence |
| Single PostgreSQL instance — 6 พ.ย. 2026 | ตามคำสั่งผู้ใช้ ย้าย test DB ไป localhost:5432 ที่เดียวกับแอปโดยแยกชื่อ database; เพิ่ม db:setup:test, เปลี่ยน local-db.ps1 เป็น wrapper ที่ไม่ start cluster, migrate/rerun suites ผ่าน, หยุด 55432 และเก็บข้อมูลเดิม; ตรวจ User rows ของแอปไม่เปลี่ยน ดู [record](sprints/sprint-1/single-instance-db.md) |
| Application release | ยังไม่มี |

เมื่อเปลี่ยน baseline ให้บันทึกเหตุผล IDs ที่กระทบ และ revision ก่อน implementation เก็บผลทดสอบ/review ตาม commit จริง; การย้ายขอบเขตที่กระทบข้อกำหนดรายวิชาต้องมีการตกลงที่เกี่ยวข้อง

## AI-use declaration

ใช้ Codex ช่วยอ่าน PDF ร่าง/ปรับเอกสาร วิเคราะห์ design และตรวจ IDs/links/traceability; ตั้งแต่ 6 พ.ย. 2026 ช่วย setup workspace, เขียน implementation/tests ของ F-01 และเก็บผลรันจริงตาม [auth work record](sprints/sprint-1/auth-work-record.md) ทีมรับผิดชอบตรวจรับและเข้าใจ code/tests และทำ teammate review เอง ผลที่ยังไม่รันไม่ถือว่าผ่าน
