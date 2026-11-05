Registration ต้องป้องกันลงซ้ำและเกินความจุเมื่อคำขอเข้าพร้อมกัน การเปลี่ยนแปลงนี้เพิ่ม F-03 API ที่ lock Event ก่อนตรวจ deadline → duplicate → capacity แล้ว insert ACTIVE ภายใน transaction เดียว และเพิ่มหน้า/component ลงทะเบียนด้วย React + TypeScript + Vite + Bootstrap ใน client/

Refs #3 — FR-06, AC-12–17, TEST-15–21, BR-03–07/10/14

## Changes

- server/: registration router/service/rules, generic JSON errors, shared schema foundation + registration migration
- client/: Vite build/dev/proxy, Bootstrap, registration action/page, availability refresh และ network-timeout guidance
- Docker Compose PostgreSQL local/test แยก volume/port และ fixture cleanup เฉพาะรอบทดสอบ
- Tests และบันทึก TDD/traceability ใน docs/registration/verification.md

## Validation

- npm run typecheck / npm run build: passed
- npm test: 39 passed
- npm run test:db: 15 passed บน PostgreSQL 17.11 Docker จริง รวม lock-wait deadline/last-seat/duplicate races
- Vite dev HTTP smoke: passed; dependency audit: 0 vulnerabilities
- Tested working tree ยังไม่มี commit; เติม revision จริงหลัง commit/rerun checks

## Integration before acceptance

Draft PR: Authentication/Event Management ของ #1/#2 ยังไม่รวมใน branch นี้ Auth/CSRF ใน tests เป็น injected guards ไม่มี runtime test-login endpoint และยังไม่อ้าง full session/browser integration ผ่าน ดู docs/registration/integration.md สำหรับ middleware identity, CSRF/Origin, schema และ Event lock convention

Staging เดิมมีเพียง README จึงเพิ่ม User/Event schema foundation ตาม SDS ต้อง reconcile migrations ร่วมกับเพื่อนก่อน deploy หาก #1/#2 มี foundation ของตนเองแล้ว

Registration Views (#4), browser journey, restart/clean reproduction, teammate review และ Product DoD ยังรอ จึงยังไม่ปิด Issue #3 อัตโนมัติ
