# Demo seed — Event / Registration examples

6 พฤศจิกายน 2026 (Asia/Bangkok) · `feature/events` merge working tree · ไม่มี commit/push

รันจาก root ด้วย `npm run db:seed` ใช้ `DATABASE_URL` และ `DEMO_SEED_PASSWORD` ใน private `server/.env` เช่นเดิม เพิ่มบัญชี demo ด้วย seedUsers เดิม แล้วสร้างเฉพาะ Event fixtures ที่ยังไม่มี ไม่ reset/drop ฐานข้อมูล ไม่เปลี่ยน schema/migration

| กิจกรรม (ชื่อขึ้นต้น [DEMO]) | เจ้าของ | สถานะเริ่มต้น / ตัวอย่าง |
|---|---|---|
| React Workshop เริ่มสร้างเว็บด้วยกัน | organizer.a | PUBLISHED เปิดรับ 3 ที่นั่ง; participant.b ลงแล้ว 1; participant.a ทดลองลงทะเบียนได้ |
| เวิร์กช็อปถ่ายภาพในมหาวิทยาลัย | organizer.a | PUBLISHED เต็ม 2 ที่นั่งจาก participant.b/c |
| เตรียมความพร้อมสมัครงาน | organizer.a | PUBLISHED แต่เลย deadline แล้ว |
| วางแผนกิจกรรมชมรม | organizer.a | DRAFT; เห็นเฉพาะ owner preview และ publish ได้ |
| กิจกรรมอาสาพัฒนาชุมชน | organizer.a | CLOSED ตัวอย่างย้อนหลัง; participant.a มี ACTIVE 1 รายการ |
| Design Thinking สำหรับนักศึกษา | organizer.b | PUBLISHED เปิดรับ; organizer.a เข้า owner route ของรายการนี้ไม่ได้ |

เลือกวัน relative ตอนสร้างครั้งแรก โดยคำนวณ calendar days/09:00–18:00 ตาม Asia/Bangkok ไม่ใช้ timezone ของเครื่อง กิจกรรมเปิดรับเริ่มอีก 7/8/10 วัน; DRAFT อีก 14 วัน CLOSED และ deadline-expired เป็น synthetic fixtures สำหรับดูสถานะ ไม่เพิ่ม Close/Cancel API

Event IDs คงที่ใน `server/prisma/demo-data.ts` พร้อม prefix `de202600-0000-4000-8000-` รันซ้ำจะข้าม Event เดิมทั้งรายการ รวม registrations ที่เกี่ยวข้อง จึงไม่เปลี่ยนเวลา/สถานะ/ชื่อ ไม่คืนที่นั่งที่ใช้แล้ว ไม่เปลี่ยน reference และไม่เติมตัวอย่างที่ถูกนำออก หากวันที่เดิมผ่านไปแล้ว seed ไม่เปิดรับใหม่เงียบ ๆ สร้างกิจกรรมใหม่ผ่าน UI ได้ตามปกติ บัญชี demo ยังคงพฤติกรรม seedUsers เดิม: เปลี่ยน password ตาม private env เมื่อผู้ใช้ตั้งค่าใหม่

Demo fixtures อยู่ใน transaction เดียว ใช้ PostgreSQL advisory transaction lock แยก seed runs เพื่อไม่สร้างซ้ำเมื่อเรียกพร้อมกัน ไม่เปลี่ยน Event → Registration lock order ใน application services

## Actual verification

- TDD [RED](evidence/demo-seed/red.log): 4 failed ก่อน implement → [GREEN](evidence/demo-seed/green.log): 4 passed บน PostgreSQL `loungcheu_test` ผ่าน Login/session/CSRF จริง
- ครอบคลุม 6 scenarios/availability/UTC/Bangkok/ownership/DRAFT visibility + real registration; rerun หลังแก้ข้อมูลและใช้ที่นั่งแล้ว/นำตัวอย่างออก/เลื่อน clock 30 วัน ต้องไม่ทับ; missing demo account ไม่ insert; concurrent seed ไม่สร้างซ้ำ
- [Full Vitest regression](evidence/demo-seed/vitest.log): **12 files / 145 passed / 0 failed/skipped**, native exit 0 (141 เดิม + seed integration 4)
- [Typecheck](evidence/demo-seed/typecheck.log): PASS รวม Prisma seed files/tests
- Browser/build/migrate/generate **ไม่ได้ rerun รอบ seed นี้**: ไม่เปลี่ยน client/API/schema/migration; ผล 32 Chromium/build/smoke เดิมอยู่ใน [consistency review](consistency-review.md) ไม่อ้างว่าเป็นผลรันใหม่

ผู้ใช้อนุญาตให้ seed ฐานแอปในคำขอนี้ ต่างจาก audit ก่อนหน้าที่ใช้เฉพาะ test DB ตรวจฐานเป้าหมายจริงก่อนเขียน: `loung-cheu-database`, localhost:5432 และมี 2 migrations เดิมครบ ไม่มี migrate/reset/drop

| App run | Actual result |
|---|---|
| [First CLI run](evidence/demo-seed/app-seed.log) | createdEvents=6, createdRegistrations=4, skippedEvents=0 |
| [Before/after + real API verification](evidence/demo-seed/app-initial-verification.json) | เดิม users=6/events=1/registrations=0 → users=6/events=7/registrations=4; users เดิม6 และ Event เดิม1 คงค่าเดิมทุก field |
| [Second CLI run](evidence/demo-seed/app-rerun.log) | createdEvents=0, createdRegistrations=0, skippedEvents=6 |
| [Rerun preservation + real API verification](evidence/demo-seed/app-rerun-verification.json) | users6/events7/registrations4 ทุก record คงเดิม รวม registration references |

App API checks ใช้ createApp/compiled application กับฐานแอปจริง Login/Logout ทั้ง Participant และ Organizer; shared เห็น 5 demo Events พร้อม counts ตรง DB, DRAFT shared404/owner200 และ own-list scope ถูกต้อง ไม่ส่ง POST registration เพิ่มในฐานแอป จึงเหลือให้ผู้ใช้ลองลงทะเบียนด้วยตนเอง ส่วน POST scenario ตรวจใน test DB แล้ว

เปิด `/events` แล้ว Login เป็น `participant.a` เลือก React Workshop เพื่อทดลองลงทะเบียน หรือ Login `organizer.a` ไป `/organizer/events` เพื่อ preview/publish DRAFT รหัสผ่านดู private `DEMO_SEED_PASSWORD` ใน IDE ไม่แสดงใน logs/เอกสาร My Registrations/roster ยังรอ Issue #4

SHA256 ของ seed source/tests และ logs อยู่ใน [manifest](evidence/demo-seed/manifest.json) หลักฐานนี้เป็น automated execution โดย Codex ไม่ใช่ independent UAT/teammate review และไม่อ้าง full Sprint 1 acceptance
