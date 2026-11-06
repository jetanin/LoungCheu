# Registration เป็น extension ของ staging

6 พ.ย. 2026 | feature/registration รวมฐาน origin/sprint-1-staging `6e8a24c`

## Base ที่คงไว้

ใช้ package/layout/scripts ของเพื่อน, React App/Login/API client, Express createApp, PostgreSQL sessions, requireAuth/requireRole, CSRF, error handler, config, seed และ migration 202611060001_auth เป็นฐาน ไม่มี runtime identity bypass หรือ app harness แยกของ Registration

client/index.html, client/src/main.tsx, Vite/TypeScript configs, Prisma config และ shared errors ยึด staging ส่วน App เพิ่มเฉพาะ authenticated route /events/{id} และคง route นี้เมื่อ refresh session; server startup เก็บการรายงาน listener error ที่แก้ไว้ก่อนหน้า

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

Event Management (#2) ยังไม่อยู่ใน staging นี้ โมเดล Event ที่เพิ่มเป็น prerequisite ของ #3 ไม่มี create/publish/list/detail APIs ให้ประสาน fields/migrations กับเจ้าของ #2 ก่อนรวมงานนั้น

## Frontend

App ของเพื่อนรับผิดชอบ Login/Logout/identity/session polling เช่นเดิม เมื่ออยู่ /events/{id} ส่ง identity/onAuthRequired ให้ RegistrationPage หน้า registration ใช้ API client client/src/lib/api.ts ของเพื่อนเพื่ออ่าน event/CSRF และส่ง registration

RegistrationAction ปิดปุ่มขณะส่ง, แสดง reference, อธิบาย conflict/refresh availability, abort/ล้างผลเมื่อ user/event เปลี่ยน และให้ตรวจ own records ก่อน retry เมื่อ network/timeout หลังเริ่ม mutation ไม่มี automatic mutation retry

เมื่อ #2 มี Event Detail สามารถนำ RegistrationAction ไป render ในหน้านั้นโดยตรงโดย reuse identity/API client ของ app ไม่ต้องทำ auth/app shell ซ้ำ

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

## Verification / งานต่อ

npm test รัน auth และ Registration บน PostgreSQL จริง Registration integration Login ผ่าน HTTP/cookies/CSRF จริง รวม token rotation/logout/inactive/expiry และ separate connections สำหรับ races ผล/attempts/ข้อจำกัดดู verification.md

Full browser publish → detail → register → own list → roster ยังรอ Event APIs (#2) และ Registration Views (#4) ยังไม่อ้าง Product DoD/release ผ่าน
