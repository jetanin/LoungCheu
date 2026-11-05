# F-03 Registration — integration contract

6 พ.ย. 2026 | Issue #3 | Branch `feature/registration`

อิง FR-06, BR-03–07/10/14, AC-12–17 และ TEST-15–21 จาก baseline v0.5 บน `docs/deliverable-1-baseline` (`f5339b9`) Source layout ปรับจาก frontend/backend ในแผนมาเป็น client/server ตามผู้ใช้กำหนด

## Backend composition กับ Authentication (#1)

```typescript
import { createDatabaseClient } from './db/client.js';
import { createRegistrationRouter } from './modules/registrations/router.js';
import { createRegistrationService } from './modules/registrations/service.js';
import { apiErrorHandler } from './shared/errors.js';

const prisma = createDatabaseClient(config.DATABASE_URL);
// Mount session middleware ของ #1 ก่อน router นี้
app.use('/api', createRegistrationRouter({
  authenticate: requireActiveSession,
  verifyCsrf: verifySessionCsrfAndOrigin,
  register: createRegistrationService(prisma),
}));
// error handler อยู่ท้าย routers ของแอปรวม
app.use(apiErrorHandler);
```

`requireActiveSession` ของ #1 ต้องอ่าน user ปัจจุบันจาก session + DB, ตรวจ expiry/is_active แล้วใส่ `res.locals.identity = { id, role, is_active }` ไม่รับ identity จาก body/header ฝั่ง client Router ตรวจ active/UUID/Participant ซ้ำก่อน CSRF ไม่มี default middleware ที่อนุญาตทุกคน

`verifySessionCsrfAndOrigin` ต้องตรวจ `X-CSRF-Token` ว่าผูกกับ session ปัจจุบัน และ Origin (ถ้ามี) ต้องตรง APP_ORIGIN ใช้ ApiError(403, 'CSRF_FAILED', ...) เมื่อไม่ผ่าน การตรวจ session จริง, token rotation, logout/expiry และ inactive session เป็นงาน #1 ที่ต้องรันร่วมอีกครั้ง

ลำดับ route นี้: authenticate → Participant role → CSRF → JSON/body/UUID → domain transaction อย่าวาง global JSON parser ที่ reject malformed input ก่อน auth/role ถ้าต้องการรักษา precedence ตาม baseline โดย router มี JSON parser ของตนแล้ว `createRegistrationApp` เป็น composition harness สำหรับ #3/tests ไม่มี backend server หรือ auth/event endpoints แฝงไว้

Success 201: `{ data: { id, event_id, status: 'ACTIVE', registered_at } }`; error envelope `{ error: { code, message, fields: {} } }` ทุกครั้ง ข้อมูล participant มาจาก trusted identity ไม่คืน participant_id/session/password

## Shared schema และ Event Management (#2)

เพราะ staging เดิมมีเพียง README จึงเพิ่ม shared foundation migration สำหรับ User/Event ตาม SDS และแยก Registration เป็น migration ถัดไป ไม่มี implementation ของ auth หรือ event-management actions

ก่อนรวมกับงานเพื่อน ให้ใช้ **User/Event foundation ชุดเดียว** ร่วมกัน: ตรวจชื่อ Prisma models/columns, FK, enums และ migration history ก่อน merge หากเพื่อนมี migrations อยู่แล้ว ให้ reconcile บน integration branch ก่อน deploy ห้ามนำ migration สร้าง User/Event ซ้ำไปลงฐานเดิมโดยไม่ตรวจ

Registration มี UUID PK, FK Event/User, unique `(event_id, participant_id)`, status ACTIVE/CANCELLED, `registered_at` แบบ timestamptz(3) และ indexes ตาม SDS ไม่มี cancel/reactivate ใน Sprint 1 ถ้าพบคู่เดิมแม้เป็น CANCELLED จะ reject ALREADY_REGISTERED เพื่อไม่เปลี่ยน record โดยไม่มี Sprint 2 workflow

`createRegistrationService` ใช้ Prisma interactive transaction READ COMMITTED:

1. Parameterized `SELECT ... FROM "Event" WHERE id = ... FOR UPDATE`
2. อ่าน application clock ใหม่หลัง lock
3. Missing/DRAFT → EVENT_NOT_FOUND; CLOSED/at-or-after deadline → REGISTRATION_CLOSED
4. คู่เดิม → ALREADY_REGISTERED; ACTIVE count เต็ม → EVENT_FULL
5. สร้าง ACTIVE ด้วย participant จาก session และ registered_at จาก clock เดียวกัน แล้วคืน response หลัง commit

Publish/close/cancel/reactivate/capacity edits ของเพื่อนและ Sprint ถัดไปต้องใช้ Event → Registration lock order เดียวกัน Unique constraint เป็นแนวป้องกันซ้ำเพิ่มเติม กรณี constraint conflict ของ unique pair แปลงเป็น ALREADY_REGISTERED โดยไม่ส่ง SQL ออก HTTP

## Frontend composition

`client/vite.config.ts`: Vite + official React plugin, `/api` proxy คง Origin; Bootstrap CSS import ใน `client/src/main.tsx` ไม่มี DB/session secrets เข้า frontend

`RegistrationPage` เป็น F-03 host แบบบางสำหรับ `/events/{id}`: ใช้ GET `/api/auth/me`, GET `/api/events/{id}`, GET `/api/auth/csrf` ตาม contracts โดยไม่ implement APIs เหล่านั้น หน้า Login/list/own registrations/roster ยังเป็นงาน #1/#2/#4

เมื่อเพื่อนมี Event Detail/app shell แล้ว ให้นำ `RegistrationAction` ไป render ในหน้านั้นได้โดยตรง ไม่จำเป็นต้องใช้ host page ซ้ำ:

```tsx
<RegistrationAction
  event={event}
  identity={identity}
  getCsrfToken={getCurrentSessionCsrfToken}
  refreshEvent={reloadEventAvailability}
  onAuthRequired={clearPrivateStateAndGoToLogin}
/>
```

Props identity มี `{id, role}` จาก /me; event ต้องมี `{id, registration_open, available_seats}`; `getCsrfToken(signal)` ต้องส่ง signal ให้ fetch และคืน token ปัจจุบันหลัง login rotate

Component ปิดปุ่มขณะส่ง, แสดง reference/ลิงก์ own list, อธิบาย conflict แล้ว refresh availability, timeout/network หลังเริ่ม POST ให้ตรวจ own list ก่อน retry ไม่มี auto retry mutation; เปลี่ยน user/event แล้วล้าง private result และ abort request เก่า การซ่อน UI ไม่แทน backend authorization

## ก่อนรับ Issue #3

- เชื่อมและรันทดสอบด้วย session/CSRF จริงของ #1 และ Event APIs ของ #2
- #4 เพิ่ม own list/detail และ organizer roster บน branch แยก
- รัน browser journey และ manual restart/teammate clean reproduction
- เพื่อน review PR, บันทึก tested commit/test results/traceability และ integration evidence จริง

ตอนนี้รับรองเฉพาะ feature-module tests ที่ระบุใน verification.md ยังไม่อ้าง Product DoD หรือ cross-feature journey ผ่าน
