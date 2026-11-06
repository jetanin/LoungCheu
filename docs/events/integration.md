# F-02 / Issue #2 integration

6 พฤศจิกายน 2026 · `feature/events` merge working tree: HEAD `04106ff` + incoming `sprint-1-staging@ada659b` (รวม #3) ดู [ผลรวม 141 Vitest / 32 Chromium](consistency-review.md) ยังไม่มี merge commit

ผู้ใช้ commit F-02 และเริ่ม merge staging ระหว่าง audit จากนั้นอนุญาตให้แก้ conflict/รวม #2/#3 ไม่พบ AGENTS.md ที่เกี่ยวข้อง Codex แก้ composition/validation/tests/docs โดยไม่ abort merge หรือ commit/push/GitHub write

## Shared foundation

Historical F-02 prerequisite: staging ตอน `6e8a24c` ไม่มี Event/Registration models จึง reuse ไฟล์ต่อไปนี้จาก `feature/registration@afa5c72`; incoming #3 ปัจจุบันยังใช้ foundation เนื้อหาเดียวกัน:

- `server/prisma/schema.prisma`
- `server/prisma/migrations/202611060002_registration_extension/migration.sql`

ชื่อ migration/checksum คงเดิม ไม่แก้ `202611060001_auth` และไม่สร้าง migration ที่สร้าง events/enums ซ้ำ Test DB มีทั้งสอง migration ใช้อยู่แล้ว; `npm run db:migrate:test` ยืนยัน no pending migrations ใช้เฉพาะ `loungcheu_test` ไม่มี migrate/reset/drop ฐานแอปในงานนี้

เอกสาร [integration ของ #3](../registration/integration.md) อัปเดตให้ตรง combined branch แล้ว ผลเดิม 110 tests/7 Auth browser เป็น historical #3; ผลปัจจุบันและ source hashes อยู่ใน [combined record](consistency-review.md)

## Backend composition

`server/src/modules/events/{input,service,router}.ts` รับผิดชอบหก endpoints ของ F-02 โดย `createApp` ใช้ auth/role/CSRF/JSON parser/error handler เดิม ก่อน unknown-API fallback:

```ts
app.use('/api', createEventRouter({
  authenticate: auth, verifyCsrf: csrf, json,
  service: createEventService(db, now),
}));
app.use('/api', createRegistrationRouter({
  authenticate: auth, verifyCsrf: csrf,
  register: createRegistrationService(db, () => new Date(now())),
}));
// ทั้งสอง routers อยู่ก่อน unknown-API fallback
```

`GET /api/events/{id}` คืน SharedEvent ครบตาม contracts โดยไม่มี owner/system/private roster fields OwnerEvent เพิ่ม organizer_id/created_at/updated_at Owner queries scope ด้วย session เสมอ

Read/create ใช้ REPEATABLE READ transaction เพื่อให้ fields/counts/list rows เป็น committed MVCC snapshot เดียวกัน ACTIVE count มาจาก registrations จริง ไม่ hardcode และไม่นับ CANCELLED Publish ใช้ READ COMMITTED transaction + parameterized Event row lock จากนั้นอ่าน clock ใหม่ ตรวจ status ก่อน deadline และส่งผลหลัง commit ทุก seat mutation ใน #3/งานถัดไปต้องคง Event → Registration lock order

## Frontend composition และ dependency ที่เหลือ

Routes: `/events`, `/events/{id}`, `/organizer/events`, `/organizer/events/new`, `/organizer/events/{id}` หน้า owner detail เป็น preview สำหรับ DRAFT และมี publish action หน้าสร้างอยู่กึ่งกลางแนวนอน รับ Bangkok wall time ระดับชั่วโมง/นาที แล้วส่ง explicit +07:00; หน้ารายการ/รายละเอียดแสดง Asia/Bangkok API ยังคงรองรับ precision 0–3 fractional digits ตาม contract

เพิ่ม optional `/organizer` สำหรับภาพรวมเฉพาะ Organizer: EventOverview อ่าน `/api/organizer/events` เดิม แสดง Event count ทั้งหมด/DRAFT/PUBLISHED และ 3 รายการแรกของ own-list order ไม่มี API/backend/schema เพิ่ม ไม่มี roster/registration/attendance summary เพิ่ม แท็บภาพรวมไม่เปลี่ยน Login redirect `/events`; Participant ยังเห็นเฉพาะ shared browsing และเข้าภาพรวมไม่ได้ อ่านใหม่เมื่อ focus โดย abort stale reads และล้างข้อมูลเมื่อ 401/403/404

`EventSchedule` แยกช่องวันที่และเวลาสำหรับ starts_at/ends_at/registration_closes_at โดยเก็บค่ารวมใน FormValues รูปแบบเดิม มี timezone panel GMT+07:00/กรุงเทพมหานคร/Asia/Bangkok และ responsive layout; ไม่ใช้เขตเวลาของเครื่อง browser ในการแปลงเวลา

ลำดับช่องตามเวลาเกิดจริงคือ registration_closes_at → starts_at → ends_at ทั้ง desktop/mobile โดยช่อง date/time ทั้งสามแถวกว้างเท่ากันและตรงแนวเดียวกัน; timezone panel อยู่ข้างทั้งสามแถวบน desktop และอยู่หลังสามแถวบน mobile

Reuse `RegistrationAction.tsx` และ `registrations/api.ts` โดยคง implementation ของ #3 ไม่มีแก้ internals Shared detail render RegistrationAction โดยตรง RegistrationPage และ component tests ของ #3 คงไว้เป็น standalone host แต่ไม่ใช้ซ้อนใน App

EventPage คง article/action ไว้ระหว่าง refresh/focus รวม transient read error ไม่สลับทั้งหน้าเป็น loading เมื่อมีข้อมูลแล้ว App identity polling/focus คง route และ component key; key เปลี่ยนเมื่อ user/role/path เปลี่ยนเพื่อแยก private state ส่วน 401 และ 403/404 ล้าง protected data ตามสิทธิ์

หลัง [spec audit](audit.md) background identity network failure แสดง warning/retry โดยคง action mounted; definitive 401 ของ session เดิมยังล้างข้อมูลเสมอ ใช้ session epoch ป้องกัน response ของบัญชีก่อนหน้ากระทบบัญชีใหม่ Event mutations รับ optional AbortSignal จาก API client และ abort/ignore callbacks เมื่อ unmount; read/publish 403/404 invalidates scope เพื่อไม่ให้ response เก่าคืน private record; publish 409 refresh ข้อมูลโดยคงเหตุผล conflict ไว้ ไม่มี automatic mutation retry

**รวม backend Registration router/service/rules และ tests ของ #3 แล้ว** `POST /api/events/{id}/registrations` ทำงานร่วมกับ Event APIs ใน createApp เดียวกัน แก้ conflicts ใน App.tsx/server app/traceability โดยเก็บ Auth lifecycle และ Event host ของ #2 พร้อม service จริงของ #3 มี API composition test ตรวจ DB readback/reference/count หลัง recreateApp และ Chromium real create→publish→register journey ไม่ใช้ mocked backend เพื่ออ้าง integration สำเร็จ

My Registrations และ roster อยู่ใน **Issue #4 (F-04/F-05)** ลิงก์ `/my/registrations` ยังรอ implementation นี้ Cancel/edit/close/check-in, full own-list/roster journey และ teammate review/release อยู่นอกงานนี้ ผลจริง/ข้อจำกัดอยู่ใน [combined verification](consistency-review.md)

Consistency re-audit: Event reads รับ definitive401 ของ mounted session ก่อน generation guard เพื่อไม่ให้ newer network failure กลบ session rejection; mounted guard กัน old-account read callback ตาม [current evidence](consistency-review.md) Event JSON budget32 KiB รองรับ BR-01 max-length escaped Unicode; Auth16 KiB/Registration1 KiB คงเดิม Username NUL ใช้ generic credential rejection/dummy scrypt ตาม Auth contract ไม่แก้ #3 internals
