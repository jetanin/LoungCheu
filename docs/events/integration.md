# F-02 / Issue #2 integration

6 พฤศจิกายน 2026 · `feature/events` working tree บน `6e8a24c45e66eb4b8df9939d5cb364c316948af4` (`sprint-1-staging` ที่มี Auth)

เริ่มต้น branch ถูกต้องและ working tree สะอาด ไม่พบ AGENTS.md ใน repo (รวม hidden paths ยกเว้น dependencies/Git) หรือ ancestor directories ที่เกี่ยวข้อง ไม่มี commit/push/merge/GitHub write ในงานนี้

## Shared foundation

Staging ไม่มี Event/Registration models จึง reuse ไฟล์ต่อไปนี้จาก `feature/registration` ที่ `afa5c72` โดยเนื้อหาตรงกันทุก byte:

- `server/prisma/schema.prisma`
- `server/prisma/migrations/202611060002_registration_extension/migration.sql`

ชื่อ migration/checksum คงเดิม ไม่แก้ `202611060001_auth` และไม่สร้าง migration ที่สร้าง events/enums ซ้ำ Test DB มีทั้งสอง migration ใช้อยู่แล้ว; `npm run db:migrate:test` ยืนยัน no pending migrations ใช้เฉพาะ `loungcheu_test` ไม่มี migrate/reset/drop ฐานแอปในงานนี้

เอกสาร [integration ของ #3](../registration/integration.md) นำมาจาก branch เพื่อนโดยไม่แก้ไข เป็นคำอธิบาย branch #3 ไม่ใช่สถานะ implementation ทั้งหมดของ branch นี้

## Backend composition

`server/src/modules/events/{input,service,router}.ts` รับผิดชอบหก endpoints ของ F-02 โดย `createApp` ใช้ auth/role/CSRF/JSON parser/error handler เดิม ก่อน unknown-API fallback:

```ts
app.use('/api', createEventRouter({
  authenticate: auth, verifyCsrf: csrf, json,
  service: createEventService(db, now),
}));
// เมื่อนำ #3 มารวม: เพิ่ม createRegistrationRouter ณ จุดเดียวกัน
// ก่อน app.use('/api', unknownApiHandler) โดยคง Event router นี้ไว้
```

`GET /api/events/{id}` คืน SharedEvent ครบตาม contracts โดยไม่มี owner/system/private roster fields OwnerEvent เพิ่ม organizer_id/created_at/updated_at Owner queries scope ด้วย session เสมอ

Read/create ใช้ REPEATABLE READ transaction เพื่อให้ fields/counts/list rows เป็น committed MVCC snapshot เดียวกัน ACTIVE count มาจาก registrations จริง ไม่ hardcode และไม่นับ CANCELLED Publish ใช้ READ COMMITTED transaction + parameterized Event row lock จากนั้นอ่าน clock ใหม่ ตรวจ status ก่อน deadline และส่งผลหลัง commit ทุก seat mutation ใน #3/งานถัดไปต้องคง Event → Registration lock order

## Frontend composition และ dependency ที่เหลือ

Routes: `/events`, `/events/{id}`, `/organizer/events`, `/organizer/events/new`, `/organizer/events/{id}` หน้า owner detail เป็น preview สำหรับ DRAFT และมี publish action หน้าสร้างอยู่กึ่งกลางแนวนอน รับ Bangkok wall time ระดับชั่วโมง/นาที แล้วส่ง explicit +07:00; หน้ารายการ/รายละเอียดแสดง Asia/Bangkok API ยังคงรองรับ precision 0–3 fractional digits ตาม contract

เพิ่ม optional `/organizer` สำหรับภาพรวมเฉพาะ Organizer: EventOverview อ่าน `/api/organizer/events` เดิม แสดง Event count ทั้งหมด/DRAFT/PUBLISHED และ 3 รายการแรกของ own-list order ไม่มี API/backend/schema เพิ่ม ไม่มี roster/registration/attendance summary เพิ่ม แท็บภาพรวมไม่เปลี่ยน Login redirect `/events`; Participant ยังเห็นเฉพาะ shared browsing และเข้าภาพรวมไม่ได้ อ่านใหม่เมื่อ focus โดย abort stale reads และล้างข้อมูลเมื่อ 401/403/404

`EventSchedule` แยกช่องวันที่และเวลาสำหรับ starts_at/ends_at/registration_closes_at โดยเก็บค่ารวมใน FormValues รูปแบบเดิม มี timezone panel GMT+07:00/กรุงเทพมหานคร/Asia/Bangkok และ responsive layout; ไม่ใช้เขตเวลาของเครื่อง browser ในการแปลงเวลา

ลำดับช่องตามเวลาเกิดจริงคือ registration_closes_at → starts_at → ends_at ทั้ง desktop/mobile โดยช่อง date/time ทั้งสามแถวกว้างเท่ากันและตรงแนวเดียวกัน; timezone panel อยู่ข้างทั้งสามแถวบน desktop และอยู่หลังสามแถวบน mobile

นำเฉพาะ `RegistrationAction.tsx` และ `registrations/api.ts` จาก `feature/registration` มา reuse โดยเนื้อหาตรงกันทุก byte ไม่มีการแก้ internals ของ #3 Shared detail render RegistrationAction โดยตรง แทนการใช้ RegistrationPage ของ #3

EventPage คง article/action ไว้ระหว่าง refresh/focus รวม transient read error ไม่สลับทั้งหน้าเป็น loading เมื่อมีข้อมูลแล้ว App identity polling/focus คง route และ component key; key เปลี่ยนเมื่อ user/role/path เปลี่ยนเพื่อแยก private state ส่วน 401 และ 403/404 ล้าง protected data ตามสิทธิ์

หลัง [spec audit](audit.md) background identity network failure แสดง warning/retry โดยคง action mounted; definitive 401 ของ session เดิมยังล้างข้อมูลเสมอ ใช้ session epoch ป้องกัน response ของบัญชีก่อนหน้ากระทบบัญชีใหม่ Event mutations รับ optional AbortSignal จาก API client และ abort/ignore callbacks เมื่อ unmount; read/publish 403/404 invalidates scope เพื่อไม่ให้ response เก่าคืน private record; publish 409 refresh ข้อมูลโดยคงเหตุผล conflict ไว้ ไม่มี automatic mutation retry

**ยังต้องนำ backend Registration router/service/rules และ tests ของ #3 มารวม** branch นี้ไม่มี `POST /api/events/{id}/registrations` กดลงทะเบียนก่อนรวม #3 จะยังไม่ได้ผลสำเร็จ อย่าเพิ่ม service หรือ RegistrationPage ซ้ำในหน้ารายละเอียด ให้คง RegistrationAction host ของ F-02 และรวม registration router ก่อน unknown-API fallback ความขัดแย้งที่คาดไว้คือ App.tsx/createApp และเอกสาร; schema/migration/API adapter/action ใช้ไฟล์เดียวกันอยู่แล้ว

My Registrations (#4), roster (#5), cancel/edit/close/check-in, full publish→register→own list→roster journey และ teammate review/release อยู่นอกงานนี้ ผลจริง/ข้อจำกัดอยู่ใน [verification](verification.md)
