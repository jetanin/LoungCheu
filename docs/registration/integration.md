# Historical record — Registration integration (6 พ.ย. 2026)

> เอกสารทั้งไฟล์เป็น historical record ของการรวม #2/#3 ณ 6 พ.ย. 2026 รวมขั้นตอน setup, ผลทดสอบ และงานที่ยังไม่ implement ในเวลานั้น ไม่ใช่สถานะหรือคำแนะนำ setup ปัจจุบัน ดู [current verification / revision](views-verification.md) และ [README ปัจจุบัน](../../README.md) สำหรับ F-04/F-05 ซึ่ง implement แล้วและรวม review fixes ใน commit 3313288

สถานะ ณ 6 พ.ย. 2026: feature/events merge working tree HEAD 04106ff + staging@ada659b รวม #2/#3 แล้ว ดู [combined verification ของรอบนั้น](../events/consistency-review.md)

## Base ที่คงไว้

ใช้ package/layout/scripts ของเพื่อน, React App/Login/API client, Express createApp, PostgreSQL sessions, requireAuth/requireRole, CSRF, error handler, config, seed และ migration 202611060001_auth เป็นฐาน ไม่มี runtime identity bypass หรือ app harness แยกของ Registration

client/index.html/main/Vite/TS/Prisma/shared errors ยึด staging App ใช้ Auth/session lifecycle + EventPage/EventOverview ของ #2 และ render RegistrationAction ของ #3 ใน shared detail โดยตรง RegistrationPage คงเป็น standalone host/component tests ไม่ใช้ซ้อนใน App; startup listener error handling ของ #3 คงไว้

## Backend composition

ภายใน createApp ก่อน unknown-API handler:

```typescript
app.use('/api', createRegistrationRouter({
  authenticate: auth,
  verifyCsrf: csrf,
  register: createRegistrationService(db, () => new Date(now())),
}));
```

auth คือ requireAuth(db, now) ของเพื่อน ตรวจ current user/isActive/absolute expiry และให้ identity จาก DB Router ใช้ requireRole('PARTICIPANT') ก่อน CSRF → JSON/input → transaction ไม่มี client-supplied user/role และไม่เปลี่ยน Login/Logout implementation

POST /api/events/{UUID}/registrations รับ EmptyInput + session cookie + X-CSRF-Token คืน 201 `{ data: { id, event_id, status: 'ACTIVE', registered_at } }` ตาม error/success envelope ของ staging

Service ใช้ READ COMMITTED และ parameterized SELECT ... FROM events ... FOR UPDATE ก่อนอ่าน application clock ใหม่ ตรวจ scope → open/deadline → duplicate → ACTIVE capacity แล้ว insert และคืน response หลัง commit ทุก seat mutation ของ #2/Sprint ถัดไปต้องใช้ Event → Registration lock order เดียวกัน

## Schema / database

คง User/users/passwordHash/displayName/isActive ของเพื่อน เพิ่ม Event/Registration ด้วย ORM camelCase, DB snake_case และ @@map เป็น events/registrations Migration 202611060002_registration_extension ต่อจาก auth โดยไม่สร้าง users/sessions/Role ซ้ำ มี FK/unique/index/capacity/time-order checks ตาม SDS

นำ legacy migrations ที่สร้าง User/Role อีกชุดออกจาก source ใหม่ ฐานที่ใช้ legacy migrations ต้องไม่ migrate ทับโดยไม่มีแผนย้ายข้อมูล รอบนี้เก็บ lou​ngcheu เดิมไว้และสร้าง loung-cheu-database ใหม่บน Docker instance เดียวกัน .env.test ชี้ loungcheu_test ที่ 5432 จาก db:setup:test ของเพื่อน ไม่มี reset/drop ฐานเก่า

Event Management (#2) รวมแล้ว: ใช้ Event schema/migration foundation เดียวกัน ไม่มี duplicate migration หรือแก้ applied history Event router และ Registration router mount ก่อน unknown-API handler

## Frontend

App รับผิดชอบ Login/Logout/identity/session polling และ route EventPage; /events/{id} อ่าน SharedEvent ครบตาม #2 แล้ว render RegistrationAction โดยตรง ใช้ API client/CSRF ของ #1

RegistrationAction ปิดปุ่มขณะส่ง, แสดง reference, อธิบาย conflict/refresh availability, abort/ล้างผลเมื่อ user/event เปลี่ยน และให้ตรวจ own records ก่อน retry เมื่อ network/timeout หลังเริ่ม mutation ไม่มี automatic mutation retry

EventPage คง RegistrationAction mounted ระหว่าง availability refresh/focus/transient error; account/event/role change และ definitive access failure ล้าง private state ตามสิทธิ์ Tests เดิมของ #3 และ host lifecycle browser tests ผ่าน

## รันจาก root

เตรียม private server/.env และ PostgreSQL Docker ตาม README ก่อน:

```powershell
npm ci
npm run db:generate
npm run db:migrate
npm run db:setup:test
npm run db:migrate:test
npm run db:seed
npm run dev
```

Demo password คือ DEMO_SEED_PASSWORD ในไฟล์ local หลัง build ใช้ npm start หรือ npm run start -w server ไม่เปิด backend ซ้อนกัน Runtime/scripts/engine policy ยึด staging (Node 22.x)

## Verification / งานต่อ ณ 6 พ.ย. 2026

npm test รัน Auth/Event/Registration และ unit/client component tests (141 PASS) บน PostgreSQL จริง; Chromium 32 PASS รวม create→publish→register จริงและ focus pending/success ดู [combined verification](../events/consistency-review.md) และ historical verification.md

**สถานะย้อนหลัง ณ 6 พ.ย. 2026:** Browser create→publish→detail→register/reference/count ผ่านแล้ว Own Registrations/roster ยังรอ Issue #4 (F-04/F-05); `/my/registrations` ยังไม่ implement ในเวลานั้น ไม่อ้าง Product DoD/release หรือ independent UAT ผ่าน
