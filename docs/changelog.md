# Document Change Log

| Version | วันที่ | เปลี่ยนแปลง | สถานะหลักฐาน |
|---|---|---|---|
| 0.1 | 4 พ.ย. 2026 | จัดทำข้อเสนอ SRS, feature inventory, traceability, system design, 3-sprint plan, Sprint 1 contracts/STS/DoD และทะเบียนหลักฐาน D1 | Documents only; ยังไม่ commit/review/implement/test |
| 0.2 | 4 พ.ย. 2026 | ผู้ใช้กำหนด stack จากภาพ: React/TypeScript/Vite/Bootstrap, Node.js/Express/TypeScript, PostgreSQL/Prisma, REST, Vitest/Supertest; ปรับ architecture/auth/config/migrations/tests และ dev integration workflow พร้อมแผน 4 Issues | Stack confirmed by user; documents only; ยังไม่ implement/test/peer review; คง FR/BR/NFR/AC/Test IDs เดิม |

## กติกาแก้ไข

1. อ้าง DEC/Issue และบอกเหตุผลก่อนแก้ขอบเขตหรือกฎ
2. ระบุ IDs ที่กระทบ: FR/BR/NFR, feature, AC และ test
3. เพิ่ม revision entry โดยไม่แก้ประวัติเก่าให้ดูเหมือนวางแผนไว้ตั้งแต่แรก
4. ระบุ reviewer และ commit เมื่อมีหลักฐานจริงเท่านั้น
5. เก็บ baseline และ release แต่ละ Sprint ให้ย้อนตรวจได้

## AI-use declaration

ใช้ Codex ช่วยอ่านเอกสารรายวิชาและร่างเอกสารวิเคราะห์ ออกแบบ วางแผน และแผนทดสอบในชุดนี้ ยังไม่มี AI-generated application code หรือผลทดสอบ ทีมต้องตรวจความถูกต้อง ยืนยันการตัดสินใจ และเข้าใจเอกสารก่อนยอมรับเป็น baseline การมีข้อความนี้ไม่ได้ยืนยันว่าทีมตรวจทานแล้ว
