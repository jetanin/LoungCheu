# Sprint 2 — Feature Engineering Contracts (F-06, F-07)

เอกสาร LC-S2-CONTRACT | v0.8 (F-06 × F-07 cross-feature status) | 24 พฤศจิกายน 2026

ฐานของ Sprint 2: `sprint-2-staging` แตกจาก `main` ที่ `0b2cc80` (tag `v1.0.1-uat`) ใช้ SRS/System SDS baseline v0.5 และ IDs เดิมตาม [traceability](../../traceability.md) เอกสารนี้ต้อง merge เข้า `sprint-2-staging` **ก่อน** เริ่มเขียนโค้ด F-06/F-07 (D2 §3.2 "contracts before implementation")

Test design แยกอยู่ใน [sts.md](sts.md)

## การจองเลข ID

| Feature | AC | Tests | ผู้เขียน contract | Reviewer |
|---|---|---|---|---|
| F-06 Cancel, re-register, close | AC-28–AC-33 | TEST-37–TEST-44 | M1 (jetanin) | M2 |
| F-07 Edit event และ capacity | AC-34–AC-40 | TEST-45–TEST-52 | M2 (i3artuf) | M1 |

เลขที่จองแต่ไม่ได้ใช้ให้เขียนว่า "unused" ไม่เลื่อนเลขของอีก feature เพื่อไม่ให้ traceability ชนกัน

## สิ่งที่ใช้ร่วมกันใน Sprint 2

- ใช้ schema `{ "data": ... }`, error schema, CSRF header, Timestamp/ID types และลำดับตรวจ auth → role → CSRF → input → record scope → domain ตาม [Sprint 1 contracts](../sprint-1/contracts.md) ไม่เปลี่ยน
- Mutation ที่กระทบที่นั่ง (register, cancel, reactivate, close, capacity edit) lock แถว Event ก่อน (`SELECT … FOR UPDATE`) แล้วจึงอ่าน/เขียน Registration ตามลำดับ Event → Registration เดียวกัน (BR-10, System SDS) และอ่าน server clock หลังได้ lock (BR-14)
- Error codes ใหม่ของ Sprint 2 (ต้องเพิ่มในตาราง error ของ System SDS ใน PR เดียวกับ implementation):

| HTTP | Code | ใช้เมื่อ | Feature |
|---|---|---|---|
| 409 | EVENT_NOT_EDITABLE | แก้กิจกรรมที่ status=CLOSED | F-07 |
| 409 | FIELD_NOT_EDITABLE | ส่ง `starts_at` / `ends_at` / `registration_closes_at` มาแก้ตอน status=PUBLISHED | F-07 |
| 409 | CAPACITY_BELOW_ACTIVE | capacity ใหม่ต่ำกว่า ACTIVE count ปัจจุบัน | F-07 |
| 409 | ALREADY_CANCELLED | ยกเลิก Registration ที่เป็น CANCELLED แล้ว ขณะที่กิจกรรมยังเปิดรับ | F-06 |

F-06 ใช้ `REGISTRATION_CLOSED` เดิมเมื่อ cancel/reactivate ขณะ CLOSED หรือถึง deadline และใช้ `INVALID_TRANSITION` เดิมเมื่อ close กิจกรรมที่ไม่ใช่ PUBLISHED; ความหมายและลำดับตรวจระบุใน F-06 ด้านล่าง

---

## F-06 — Cancel, re-register และ close event

**Links:** FR-09–10, FR-12; BR-03–11, BR-14; NFR-01, NFR-03, NFR-04, NFR-05, NFR-06; V2-01, V2-02, V2-04; dependency: F-03–05

สถานะ: **implemented; local verification recorded; ยังไม่ถือว่า Done/accepted release** งานออกแบบ #46 ปิดแล้วตามข้อมูลผู้ใช้; implementation #47 บน `feature/47-f06` ผูก source ล่าสุดที่ผู้ใช้ระบุ `ba89488079a2c884735a18642dbd7487b6872559` ดู [completion/หลักฐานและข้อจำกัด](README.md) ซึ่งแยกผลแต่ละ commit ออกจาก CI/review/merge/release ที่ยัง pending; TEST-44(c) และ TEST-47/52 แบบใช้ close จริงรันแล้วใน PR integration `test/47-sprint-2-cross-feature` ([ผล](evidence/f07-cross-feature/README.md))

**NFR → verification design** (อ้างอิง [SRS](../../srs.md); ผลรันจริงอยู่ใน [completion](README.md); NFR-03 มี actual backend process restart เพิ่มจาก reload/re-login):

| NFR | ขอบเขตใน F-06 | Planned tests |
|---|---|---|
| NFR-01 | Access matrix: auth/role/ownership/CSRF และไม่เปิดเผยข้อมูลข้ามผู้ใช้ | TEST-41 |
| NFR-03 | Persistence: อ่าน state/reference/timestamp กลับหลัง reload และ re-login | TEST-43 |
| NFR-04 | Race ที่นั่งสุดท้ายและ duplicate cancel/reactivate ไม่ทำให้ record/history ซ้ำหรือ ACTIVE เกิน capacity | TEST-42 |
| NFR-05 | Fresh disposable DB: migrate → seed แล้ว Registration/history ครบและ seed ซ้ำได้ | TEST-44(a) |
| NFR-06 | Error format/code/message และการปฏิเสธสิทธิ์ตรง contract ไม่เปิดเผยข้อมูลภายใน | TEST-41 |

### Workflow / UI

Participant เปิด **รายการลงทะเบียนของฉัน** → เปิดรายละเอียด → กด **ยกเลิกการลงทะเบียน** → ยืนยัน → เห็น CANCELLED และเวลายกเลิก ที่นั่งคืนทันที เมื่อกิจกรรมยังเปิดรับและมีที่นั่ง เปิดหน้ากิจกรรม → กด **ลงทะเบียนใหม่** → เห็น ACTIVE พร้อมเลขอ้างอิงเดิม Organizer เปิดรายละเอียดกิจกรรมของตน → กด **ปิดรับกิจกรรม** → ยืนยัน → เห็น CLOSED โดยรายการลงทะเบียนเดิมยังอยู่

| การกระทำ | เงื่อนไข | ผลสำเร็จ |
|---|---|---|
| Cancel | Participant เจ้าของ Registration, ACTIVE, Event=PUBLISHED และ server_now < registration_closes_at | เปลี่ยนเป็น CANCELLED, ตั้ง cancelled_at, ACTIVE count ลด 1 |
| Re-register | Participant มี CANCELLED เดิม, Event=PUBLISHED, ยังไม่ถึง deadline และ ACTIVE count < capacity | reactivate record เดิมเป็น ACTIVE, ล้าง cancelled_at, ACTIVE count เพิ่ม 1 |
| Close | Organizer เจ้าของ Event ที่เป็น PUBLISHED | เปลี่ยนเป็น CLOSED แม้ deadline ผ่านแล้ว; ไม่เปลี่ยน Registration หรือจำนวน ACTIVE |

UI rules:

- แสดงปุ่ม cancel บน own detail เฉพาะ ACTIVE ของกิจกรรม PUBLISHED ที่ยังไม่ถึง deadline และแสดงเวลาปิดรับเป็น Asia/Bangkok; server เป็นผู้ตัดสินเมื่อกดจริง การยกเลิก confirmation dialog ไม่ส่ง mutation
- รายการและรายละเอียดของตน รวมถึงหัวคอลัมน์เวลาใน roster ใช้ชื่อ **ลงทะเบียนครั้งแรกเมื่อ** สำหรับ `registered_at` เหมือนกัน เพื่อไม่ให้เข้าใจว่าเป็นเวลาลงใหม่; own list/detail แสดง ACTIVE/CANCELLED และ `cancelled_at` เมื่อ CANCELLED ไม่เพิ่มหน้า history ใน Sprint 2
- หน้ากิจกรรมของ Participant ใช้ `GET /api/my/registrations` เดิม แล้วเลือก record ที่ `record.event.id` ตรงกับ event ID ของหน้าปัจจุบันจากผลของ session ปัจจุบัน ไม่มี endpoint ใหม่สำหรับ lookup นี้; พบ ACTIVE แสดงว่าลงทะเบียนแล้ว พบ CANCELLED แสดง **ลงทะเบียนใหม่** เมื่อ registration_open=true และเมื่ออ่านสำเร็จแต่ไม่พบ record จึงแสดงปุ่มลงทะเบียนปกติ เมื่ออ่านล้มเหลวให้แสดง error/retry ไม่ตีความว่าไม่เคยลงทะเบียน ล้างผล lookup เมื่อ session/account หรือ event ID เปลี่ยน และไม่ให้ response เก่าทับ session/event ใหม่
- หากพบ CANCELLED แต่กิจกรรม PUBLISHED ยังไม่ถึง deadline และ available_seats=0 ให้แสดง **คุณยกเลิกการลงทะเบียนแล้ว ขณะนี้กิจกรรมเต็ม** แทนปุ่มลงทะเบียนใหม่ พร้อมปุ่ม **รีเฟรชที่นั่ง**; หาก CLOSED หรือถึง deadline ให้แสดง **คุณยกเลิกการลงทะเบียนแล้ว กิจกรรมนี้ปิดรับลงทะเบียนแล้ว** และไม่แสดงปุ่มลงทะเบียนใหม่ เมื่อ refresh แล้วเปิดรับและมีที่นั่งจึงแสดงปุ่มลงทะเบียนใหม่ กรณีเงื่อนไขเปลี่ยนหลังอ่านข้อมูล server ยังปฏิเสธด้วย EVENT_FULL/REGISTRATION_CLOSED ตามลำดับตรวจเดิม
- Organizer เห็นปุ่ม close เฉพาะ PUBLISHED; ก่อนยืนยันแจ้งว่าปิดแล้วเปิดกลับไม่ได้และไม่ยกเลิกรายการเดิม DRAFT/CLOSED ไม่มีปุ่มนี้
- หลัง mutation สำเร็จโหลด own record, availability หรือ roster ที่เกี่ยวข้องใหม่จาก server; roster ยังคงแถว CANCELLED ไว้ แต่ `active_count` นับเฉพาะ ACTIVE และไม่เพิ่มแถวเมื่อ reactivate
- แสดง loading/disabled กันการกดซ้ำ, 401 ล้างข้อมูลส่วนตัวและกลับ login, 403/404 ไม่แสดงข้อมูลข้ามสิทธิ์ เมื่อ 409 แสดงเหตุผลแล้ว refresh state ก่อนให้ตัดสินใจใหม่
- หาก network timeout และยังไม่ทราบว่า commit แล้วหรือไม่ ห้าม retry อัตโนมัติ ให้ผู้ใช้ refresh own record/owner event ก่อน; backend ยังคงป้องกัน duplicate transition และ history ซ้ำ

| Code / บริบท | ข้อความ UI |
|---|---|
| ALREADY_CANCELLED | รายการนี้ถูกยกเลิกแล้ว |
| REGISTRATION_CLOSED / cancel | กิจกรรมปิดรับแล้วหรือเลยกำหนด จึงยกเลิกไม่ได้ |
| REGISTRATION_CLOSED / register หรือ reactivate | กิจกรรมนี้ปิดรับลงทะเบียนแล้ว |
| ALREADY_REGISTERED | คุณลงทะเบียนกิจกรรมนี้แล้ว ตรวจสอบได้ในรายการของฉัน |
| EVENT_FULL | กิจกรรมเต็มแล้ว |
| INVALID_TRANSITION / close | ปิดรับได้เฉพาะกิจกรรม PUBLISHED |
| REGISTRATION_NOT_FOUND / EVENT_NOT_FOUND | ไม่พบรายการลงทะเบียนนี้ / ไม่พบกิจกรรมนี้ |

### API / data contract

ใช้ EmptyInput (ไม่มี body หรือ `{}`) และ valid CSRF header ทุก mutation; `null`, array, primitive หรือ field เพิ่ม รวม participant_id/status/registered_at/cancelled_at/event_id ใน body ตอบ 400 INVALID_INPUT Parser budget: Registration 1 KiB และ Event 32 KiB ตามเดิม

| Method / path | Request | Success | Failure |
|---|---|---|---|
| POST /api/my/registrations/{id}/cancel | EmptyInput; participant จาก session | 200 data: MyRegistrationS2 | 400 INVALID_INPUT; 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN / CSRF_FAILED; 404 REGISTRATION_NOT_FOUND; 409 REGISTRATION_CLOSED / ALREADY_CANCELLED |
| POST /api/events/{id}/registrations (ขยาย endpoint F-03 เดิม) | EmptyInput; participant จาก session | 201 data: RegistrationResultS2 เมื่อสร้างใหม่; 200 data: RegistrationResultS2 เมื่อ reactivate | 400 INVALID_INPUT; 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN / CSRF_FAILED; 404 EVENT_NOT_FOUND; 409 REGISTRATION_CLOSED / ALREADY_REGISTERED / EVENT_FULL |
| POST /api/organizer/events/{id}/close | EmptyInput; organizer จาก session | 200 data: OwnerEvent หลัง close | 400 INVALID_INPUT; 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN / CSRF_FAILED; 404 EVENT_NOT_FOUND; 409 INVALID_TRANSITION |

**Response schemas:**

- `RegistrationResultS2` = RegistrationCreated ของ Sprint 1 พร้อม `cancelled_at: Timestamp | null` ที่ required; create/reactivate สำเร็จจึงเป็น ACTIVE และ cancelled_at=null เสมอ
- `MyRegistrationS2` = MyRegistration เดิมพร้อม `cancelled_at: Timestamp | null` ที่ required; GET own list/detail ใช้ schema นี้ด้วย CANCELLED ยังคงปรากฏในรายการของตนและยังอ่านได้แม้ Event=CLOSED
- ACTIVE ต้องมี cancelled_at=null; CANCELLED ต้องมี cancelled_at เป็นเวลา UTC `.SSSZ` เลขอ้างอิง, event_id, participant_id และ registered_at ครั้งแรกไม่เปลี่ยนเมื่อ cancel/reactivate
- OwnerEvent และ Roster ใช้ schema เดิม (**no change**); roster คืนทุก Registration ตามสถานะปัจจุบัน เรียง registered_at ASC, id ASC เช่นเดิม และไม่นับ CANCELLED ใน active_count ไม่มี public history endpoint/UI ใน baseline
- Client API และ regression assertions ต้องรองรับ response field ที่เพิ่มและ HTTP 200 สำหรับ reactivate โดยผลสร้างใหม่ยังเป็น 201 ตาม Sprint 1

**ลำดับ cancel** (ใช้เหตุผลแรกที่เจอ):

1. auth → role PARTICIPANT → CSRF → path UUID และ EmptyInput; input ผิดตอบ 400
2. อ่านเฉพาะ id/event_id ของ Registration ที่ `id` และ `participant_id` ตรง session เพื่อหา Event ที่จะ lock; ไม่พบ/ไม่ใช่ของตนตอบ 404 REGISTRATION_NOT_FOUND ขั้นนี้ยังไม่ lock Registration หรือเชื่อ state ที่อ่านมา
3. lock Event ด้วย event_id ก่อน แล้วอ่านและ lock Registration ของตนอีกครั้งใน transaction เดียวกันตาม Event → Registration; ไม่พบตอบ 404 REGISTRATION_NOT_FOUND
4. อ่าน server clock หลังได้ Event lock; Event ไม่ใช่ PUBLISHED หรือ clock >= deadline ตอบ 409 REGISTRATION_CLOSED **ก่อน** ตรวจว่า cancel ไปแล้ว
5. Registration=CANCELLED ตอบ 409 ALREADY_CANCELLED; ACTIVE เปลี่ยนเป็น CANCELLED ตั้ง cancelled_at จาก clock และ append CANCELLED history แล้ว commit ก่อนคืน 200; ไม่ตรวจ capacity เพราะการคืนที่นั่งต้องทำได้แม้กิจกรรมเต็ม

**ลำดับ register/reactivate:** auth → role PARTICIPANT → CSRF → UUID/EmptyInput → lock Event → อ่าน clock ใหม่ → scope (ไม่พบ/DRAFT=404 EVENT_NOT_FOUND) → status/deadline (CLOSED หรือ clock >= deadline=409 REGISTRATION_CLOSED) → อ่าน/lock Registration ของ session หากมี → ACTIVE เดิม=409 ALREADY_REGISTERED → นับ ACTIVE หลัง lock และตรวจ capacity (เต็ม=409 EVENT_FULL) → ไม่เคยมี record: create ACTIVE + REGISTERED history, คืน 201; มี CANCELLED: update record เดิมเป็น ACTIVE, ล้าง cancelled_at + REACTIVATED history, คืน 200 ทั้งสองทางทำใน transaction เดียว ไม่สร้าง Registration เพิ่มเมื่อ reactivate

**ลำดับ close:** auth → role ORGANIZER → CSRF → UUID/EmptyInput → lock Event ด้วย id และ organizer_id จาก session → ไม่พบ/ไม่ใช่เจ้าของ=404 EVENT_NOT_FOUND → status ไม่ใช่ PUBLISHED=409 INVALID_TRANSITION → อ่าน clock หลัง lock แล้วเปลี่ยนเป็น CLOSED พร้อม updated_at=clock → commit และคืน OwnerEvent ไม่ตรวจ deadline สำหรับ close; close ซ้ำถูกปฏิเสธ ไม่เปิดกลับและไม่ลบ/ยกเลิก Registration ใด

ทุก rejection ต้องไม่ทำให้ operation นั้นเปลี่ยน Event/Registration/history แม้แต่ timestamp; cancel/reactivate ไม่แก้ Event fields หรือ updated_at และ close ไม่แก้ Registration/history จำนวนที่นั่งว่างยังเป็น capacity − ACTIVE count แต่ CLOSED มี registration_open=false เสมอ การเปลี่ยนที่เกิดจาก transaction คู่แข่งที่สำเร็จไม่ใช่ side effect ของ request ที่ถูกปฏิเสธ

**Data / migration (implemented ใน #47; ผล CLI/seed/rollback อยู่ใน completion):**

| ส่วน | การเปลี่ยนแปลง |
|---|---|
| Registration | เพิ่ม Prisma `cancelledAt` → SQL/API `cancelled_at`, nullable `timestamptz(3)`; คง UNIQUE(event_id, participant_id), FK และ registered_at เดิม |
| RegistrationHistory | เพิ่ม table `registration_history`: id UUID PK, registration_id FK → registrations, actor_id FK → users, action enum REGISTERED/CANCELLED/REACTIVATED, occurred_at `timestamptz(3)`; index (registration_id, occurred_at, id); FK ใช้ Restrict ไม่ cascade ลบหลักฐาน |
| Backfill | versioned migration เพิ่ม REGISTERED 1 แถวต่อ Registration เดิม ใช้ actor_id=participant_id และ occurred_at=registered_at; SQL INSERT ต้องสร้าง history.id ด้วย `gen_random_uuid()` เพราะ `@default(uuid())` สร้าง UUID ฝั่ง Prisma client ไม่ใช่ SQL DEFAULT; ไม่สร้าง users/events/registrations ใหม่ ไม่แก้ reference/status/registered_at หรือ reset ข้อมูล Sprint 1 |
| Seed / demo data | บน DB ใหม่ migration/backfill รันก่อน seed จึงต้องปรับเส้นทาง `server/prisma/seed.ts` และ `server/prisma/demo-data.ts` ให้ทุก Registration ที่สร้างหลัง migration มี REGISTERED history 1 แถวใน transaction เดียวกัน ใช้ actor_id=participant_id และ occurred_at=registered_at; seed ซ้ำหรือพร้อมกันไม่เพิ่ม Registration/history ซ้ำ ไม่สร้าง lifecycle ที่เดาเองหรือทับ state/history ของ record เดิม |
| Consistency | ทุก Registration ใหม่มี REGISTERED history และทุก cancel/reactivate ที่สำเร็จ append history 1 แถวใน transaction เดียวกับ state; ถ้าเขียน history ไม่สำเร็จ rollback state ด้วย; rejected/repeated request ไม่เพิ่ม history และ close ไม่สร้าง RegistrationHistory |

ก่อน migration ตรวจว่า legacy data ตรง baseline Sprint 1 (ACTIVE เท่านั้น); หากพบ CANCELLED เดิมที่ไม่มีเวลายกเลิกให้หยุดและจัดทำ data reconciliation ก่อน ห้ามสร้าง cancelled_at/history ที่เดาเอง การรัน migrate deploy ซ้ำไม่เพิ่ม backfill ซ้ำเพราะ migration version ถูกบันทึกแล้ว; การ cancel/reactivate หลายรอบต้อง append ได้ จึงไม่ใช้ unique(registration_id, action) ที่จะบล็อกวงจรถัดไป

### Feature design (SDS)

**State transition:**

```
ไม่มี Registration ──register [เปิดรับ + มีที่นั่ง]──▶ ACTIVE + REGISTERED history
ACTIVE ──cancel [เปิดรับ]──▶ CANCELLED + CANCELLED history
CANCELLED ──register [เปิดรับ + มีที่นั่ง]──▶ ACTIVE (id/registered_at เดิม) + REACTIVATED history
PUBLISHED ──close [เจ้าของ]──▶ CLOSED (Registration คงเดิม)
```

ACTIVE → register ซ้ำ และ CANCELLED → cancel ซ้ำ ถูกปฏิเสธตาม precedence ข้างต้น DRAFT → close, CLOSED → close และ CLOSED → PUBLISHED ไม่อนุญาต การ publish DRAFT ยังเป็น F-02 ตามเดิม

| Layer | เปลี่ยน | รายละเอียด |
|---|---|---|
| UI | เปลี่ยน | cancel/confirmation บน own detail, CANCELLED/cancelled_at บน own list/detail, re-register บนหน้ากิจกรรมผ่าน own-list lookup เดิม, close/confirmation บน owner detail และ refresh roster/count; own list/detail และ roster ใช้ label ลงทะเบียนครั้งแรกเมื่อ เหมือนกัน; อยู่ใน features/registrations และ features/events |
| API | เปลี่ยน | เพิ่ม cancel ใน modules/registrations และ close ใน modules/events; ขยาย register service/router/serializer เดิมให้ reactivate และ append history; own-read serializer เพิ่ม cancelled_at |
| Data | เปลี่ยน | migration cancelled_at, RegistrationHistory/action enum/backfill ตามตารางด้านบน; Event และ session schema **no change** |

**Service design:** ใช้ Prisma interactive transaction แบบ READ COMMITTED และ transaction client เดียวตลอด operation ทุก seat mutation ใช้ Event lock เดียวกับ F-03/F-07 และเวลาเดียวจาก clock หลัง lock; cancel หา event_id ผ่าน scoped read แล้ว lock Event ก่อน Registration และ recheck state; close lock Event ด้วย id + organizer_id; register/reactivate lock Event ก่อนอ่าน Registration/count การนับและ response serialization อยู่ภายใต้ Event lock แล้วจึง commit ก่อนส่ง response ห้ามแยกเขียน history หลัง commit หรือเรียก service ที่เปิด transaction ซ้อนเพื่อนับที่นั่ง

**Concurrency:** cancel ซ้ำพร้อมกันสำเร็จครั้งเดียวและมี CANCELLED history เพิ่มครั้งเดียว; reactivate ซ้ำสำเร็จครั้งเดียวและอีกคำขอเป็น ALREADY_REGISTERED; reactivate แข่งกับผู้ใช้ใหม่แย่งที่นั่งสุดท้ายสำเร็จได้คนเดียว; close แข่งกับ register/reactivate/cancel ถ้า close ได้ lock ก่อน อีกคำขอถูก REGISTRATION_CLOSED ถ้า seat mutation ได้ lock และผ่าน deadline ก่อน ให้สำเร็จแล้ว close รักษาผลนั้นไว้; request ที่รอ lock จนถึง deadline ต้องถูกปฏิเสธแม้ส่งมาก่อน deadline การลด capacity หลัง cancel อ่าน ACTIVE count ล่าสุดและยังต้องเคารพ minimum capacity=1 ของ F-07

**Permissions:**

| ผู้เรียก | Cancel | Register/reactivate | Close |
|---|---|---|---|
| Anonymous | 401 AUTH_REQUIRED | 401 AUTH_REQUIRED | 401 AUTH_REQUIRED |
| Participant | เฉพาะของตน; คนอื่น/ไม่มี record=404 REGISTRATION_NOT_FOUND | ของตนจาก session ตาม event-open/capacity; spoof input=400 | 403 ROLE_FORBIDDEN |
| Organizer | 403 ROLE_FORBIDDEN | 403 ROLE_FORBIDDEN | เฉพาะกิจกรรมตน; คนอื่น/ไม่มี Event=404 EVENT_NOT_FOUND |

ทุก role ที่มีสิทธิ์ทำ mutation ยังต้องผ่าน CSRF/Origin ตาม Sprint 1; direct URL/API ต้องบังคับสิทธิ์เช่นเดียวกับ UI

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-28 | เจ้าของ cancel ACTIVE ก่อน deadline ของ PUBLISHED ได้ 200 CANCELLED, cancelled_at=clock หลัง lock, id/registered_at เดิม; ACTIVE count ลดและผู้ใช้อื่นใช้ที่นั่งได้; state/history persist และ cancel ซ้ำไม่เปลี่ยนข้อมูล | TEST-37, TEST-40, TEST-43 |
| AC-29 | CANCELLED ลงใหม่ได้เมื่อเปิดรับและมีที่นั่ง: 200 ACTIVE ด้วย id/registered_at เดิม, cancelled_at=null, REACTIVATED history เพิ่ม 1; ไม่สร้าง record ซ้ำ; create ใหม่ยัง 201 และเพิ่ม REGISTERED history; ACTIVE ซ้ำยัง ALREADY_REGISTERED | TEST-38, TEST-40, TEST-42, TEST-43 |
| AC-30 | เจ้าของ close PUBLISHED ได้ก่อน/ที่/หลัง deadline; 200 CLOSED, updated_at เปลี่ยน, Registration/history/count เดิมและยังอ่าน own/roster ได้; DRAFT/close ซ้ำได้ INVALID_TRANSITION; CLOSED register/reactivate/cancel ไม่ได้ | TEST-39, TEST-40, TEST-43 |
| AC-31 | Cancel/reactivate ตรวจ clock หลัง Event lock: deadline−1 ms อนุญาตเมื่อเงื่อนไขอื่นครบ; ที่/+1 ms และรอ lock จน deadline ปฏิเสธ; error precedence และ invalid/spoofed input ตรง contract; request ที่ถูกปฏิเสธไม่เปลี่ยน state/timestamp/history | TEST-40, TEST-42 |
| AC-32 | Cancel/register/reactivate/close บังคับ auth/role/ownership/CSRF/Origin; ไม่เปิดเผย record ของผู้อื่น; UI confirmation/loading/retry/409 ภาษาไทยและ refresh ค่าใหม่ทำงาน พร้อมอ่านค่าเดิมหลัง reload/re-login | TEST-41, TEST-43 |
| AC-33 | คำขอพร้อมกันไม่ทำให้ ACTIVE เกิน capacity, Registration/history ซ้ำ หรือ deadlock/500; close ไม่ลบผลที่ commit ก่อนหน้า; cancel แล้วลด capacity ได้ตามยอดใหม่; migration/backfill คงข้อมูล Sprint 1 และ state/history เขียนหรือ rollback พร้อมกัน | TEST-42, TEST-44 |

DoD F-06 (ครบทุกข้อจึงถือว่าเสร็จ):

1. AC-28–AC-33 ผ่านด้วย test ที่รันจริงตาม TEST-37–44 (unit/API/DB/concurrency/component/E2E และ migration) บันทึกคำสั่ง, commit, passed/failed/skipped; contract/STS นี้เป็นแผน ไม่ใช่ผล PASS
2. เก็บ meaningful RED ก่อน implementation และ GREEN ของ test เดียวกัน พร้อม SHA/assertion/output; fixture หรือ migration error ไม่ใช้แทน RED ของกฎธุรกิจ
3. Sprint 1 automated regression ผ่าน; ปรับ expected schema เฉพาะ cancelled_at ที่เพิ่มและเพิ่ม reactivate 200 พร้อมตรวจและอัปเดต component/E2E assertions ที่อ้าง label เดิม ลงทะเบียนเมื่อ ให้เป็น ลงทะเบียนครั้งแรกเมื่อ ทั้ง own list/detail และ roster โดยยัง assert ค่า registered_at ครั้งแรกเดิม และไม่ลด assertions ของ create/duplicate/access/time/concurrency เดิม
4. versioned migration/backfill และ rollback-on-history-failure ผ่านบน test DB; seed/demo-data ต้องสร้าง REGISTERED history ด้วยสำหรับ Registration ที่สร้างหลัง migration และผ่านการตรวจ fresh DB → migrate → seed รวม seed ซ้ำ/พร้อมกันโดยไม่เกิด record/history ซ้ำ; อัปเดต System SDS (schema/API/error table), features.md และ traceability ให้ตรง implementation โดยประสานงานเอกสาร D2 ใน #51
5. Trace ได้ครบ: Issue #47 → branch `feature/47-…` จาก sprint-2-staging หลัง contract ผ่าน review/merge → PR ที่ teammate review แบบมีเนื้อหา + CI ผ่าน → staging integration → reviewed main release/deploy/tag ของ Sprint 2 (เช่น `v2.0.0-sprint-2` ให้ระบุได้แม้ candidate ภายหลังจะมีงานเพิ่ม); ไม่เปลี่ยนรุ่น Lab 6 ระหว่าง UAT โดยไม่แจ้งทีมคู่
6. มีแถวใน completion table ของ Sprint 2 เชื่อม AC, implementation file/commit, executed TEST/result และ accepted release; ทดสอบ cancel × capacity edit และ close × edit ร่วมกับ #48 ก่อน release
7. ผ่าน [Product DoD](../sprint-1/README.md) DOD-01–DOD-10 ที่เกี่ยวข้อง รวม persistence/race, no secrets, เปิดเผยงานไม่ครบ และ CI/GCP post-deploy checks; teammate review contract ใน #46 ก่อนเริ่มโค้ด #47

---

## F-07 — Edit event details และ capacity

**Links:** FR-11; BR-01–02, BR-05, BR-07, BR-09–11, BR-14; NFR-01, NFR-03, NFR-06; V2-03; dependency: F-02 (event/owner routes), F-03 (ACTIVE count และ Event lock)

หมายเหตุ traceability: [features.md](../../features.md) ระบุ F-07 = BR-01–02,07,10–11,14 เอกสารนี้เพิ่ม BR-05 (ACTIVE ≤ capacity ระหว่างลด capacity ตรงกับ traceability แถว BR-05) และ BR-09 (CLOSED แก้ Event fields ไม่ได้) ต้องอัปเดต features.md และแถว BR-09 ใน traceability ให้ตรงใน #51

### Workflow / UI

Organizer เปิดกิจกรรมของตน (`/organizer/events/{id}`) → กด **แก้ไขกิจกรรม** → ฟอร์มเติมค่าปัจจุบันไว้ → แก้ค่า → กด **บันทึกการแก้ไข** → กลับหน้ารายละเอียดพร้อมข้อความสำเร็จ "บันทึกการแก้ไขแล้ว" และค่าที่อ่านกลับจาก server

สิ่งที่แก้ได้ขึ้นกับสถานะ (FR-11, BR-09, BR-11):

| Status | แก้ได้ | แก้ไม่ได้ |
|---|---|---|
| DRAFT | ทุก field ใน EventInput: title, description, location, capacity, starts_at, ends_at, registration_closes_at | id, organizer_id, status, created_at, updated_at |
| PUBLISHED | title, description, location, capacity | starts_at, ends_at, registration_closes_at และ system fields |
| CLOSED | ไม่มี (ไม่แสดงปุ่มแก้ไข) | ทุก field |

UI rules:

- ปุ่ม **แก้ไขกิจกรรม** แสดงเฉพาะ DRAFT/PUBLISHED บนหน้า owner detail เปิด `/organizer/events/{id}/edit`
- PUBLISHED: ช่องเวลาทั้งสามแสดงค่าเดิมแบบ disabled พร้อมข้อความ "เผยแพร่แล้ว แก้เวลาไม่ได้"
- เมื่อ PUBLISHED ช่อง capacity แสดงคำอธิบาย "มีผู้ลงทะเบียน ACTIVE n คน ตั้งได้ไม่ต่ำกว่า n" (DRAFT ไม่แสดง เพราะลงทะเบียนได้เฉพาะ PUBLISHED จึงมี ACTIVE = 0 เสมอ) (ค่า n จาก `active_count` ตอนเปิดฟอร์ม) เป็นคำอธิบายเท่านั้น ไม่บล็อกการกดบันทึก เพราะยอดอาจเปลี่ยนระหว่างแก้ server เป็นผู้ตัดสิน
- ส่งเฉพาะ field ที่เปลี่ยน ถ้าไม่มีอะไรเปลี่ยน ปุ่มบันทึกถูกปิด
- ใช้ validation ฝั่ง client แบบเดียวกับหน้าสร้าง (BR-01/02) แต่ backend เป็นผู้ตัดสิน; แสดง loading/disabled ระหว่างส่ง
- เมื่อได้ 409 แสดงเหตุผลภาษาไทย แล้วโหลดข้อมูลกิจกรรมล่าสุด (status, active_count) มาแสดงใหม่ โดยคงค่าที่ผู้ใช้พิมพ์ไว้ในฟอร์ม (เช่น มีคนลงทะเบียนเพิ่มระหว่างแก้จนคำอธิบาย capacity ต้องเปลี่ยน)
- 404 แสดง "ไม่พบกิจกรรมนี้" เหมือน owner detail; Participant เปิด URL แก้ไขเห็นหน้าปฏิเสธสิทธิ์แบบเดียวกับ owner routes

ข้อความ error ใหม่ที่ UI ต้องแสดง:

| Code | ข้อความ |
|---|---|
| EVENT_NOT_EDITABLE | กิจกรรมนี้ปิดแล้ว แก้ไขไม่ได้ |
| FIELD_NOT_EDITABLE | กิจกรรมเผยแพร่แล้ว แก้เวลาเริ่ม เวลาสิ้นสุด และเวลาปิดรับไม่ได้ |
| CAPACITY_BELOW_ACTIVE | จำนวนที่นั่งต้องไม่น้อยกว่าผู้ลงทะเบียน ACTIVE ปัจจุบัน (n คน) |
| INVALID_INPUT | ใช้ข้อความรายช่องเดียวกับหน้าสร้างกิจกรรม เช่น "กรุณากรอก 1–120 ตัวอักษร", "จำนวนที่นั่งต้องเป็นจำนวนเต็ม 1–1000" |

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| PATCH /api/organizer/events/{id} | EventPatch + CSRF header | 200 data: OwnerEvent (ค่าหลังแก้, `updated_at` ใหม่) | 400 INVALID_INPUT; 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN / CSRF_FAILED; 404 EVENT_NOT_FOUND; 409 EVENT_NOT_EDITABLE / FIELD_NOT_EDITABLE / CAPACITY_BELOW_ACTIVE |

**EventPatch:** JSON object ที่มี field จาก EventInput **อย่างน้อย 1 field** แต่ละ field ใช้ type/trim/length/range เดียวกับ EventInput (BR-01, BR-14) ห้าม `null`; field อื่น (เช่น `id`, `organizer_id`, `status`, `created_at`, `updated_at`, `active_count`) หรือ object ว่าง ตอบ 400 INVALID_INPUT (BR-11) Parser budget 32 KiB เท่า Event

**ลำดับการตรวจ** (ผลลัพธ์คือเหตุผลแรกที่เจอ):

1. auth → role ORGANIZER → CSRF
2. path UUID และรูปแบบ EventPatch → 400 INVALID_INPUT
3. lock Event ด้วย id **และ** organizer_id ของ session; ไม่พบหรือไม่ใช่ของตน → 404 EVENT_NOT_FOUND (ไม่เปิดเผยว่ามีอยู่)
4. status = CLOSED → 409 EVENT_NOT_EDITABLE
5. status = PUBLISHED และ patch มี field เวลา → 409 FIELD_NOT_EDITABLE (แม้ค่าจะเท่าเดิม)
6. รวมค่า patch กับค่าเดิมแล้วตรวจ `registration_closes_at <= starts_at < ends_at` (BR-02) → 400 INVALID_INPUT
7. ถ้า patch มี capacity: นับ ACTIVE จาก DB หลัง lock; capacity ใหม่ < ACTIVE count → 409 CAPACITY_BELOW_ACTIVE
8. update แล้ว commit; ทุกกรณีที่ถูกปฏิเสธต้องไม่เปลี่ยนข้อมูลใด ๆ รวม `updated_at`

**Data:** ไม่มี migration ใช้ Event model เดิม (`updated_at` เป็น `@updatedAt`) owner และ status เปลี่ยนผ่าน endpoint นี้ไม่ได้ DRAFT ยังเก็บเวลาในอดีตได้ถ้าลำดับถูก (เหมือนตอนสร้าง) ส่วนการ publish ยังตรวจ deadline ตาม F-02 การเพิ่ม capacity ของกิจกรรมที่เต็มทำให้ `available_seats` และ `registration_open` คำนวณใหม่ทันที (ถ้ายังไม่เลย deadline) ไม่มี history ของการแก้ไขใน baseline

**Concurrency (BR-05, BR-10):** การลด capacity และการลงทะเบียนบน event เดียวกันใช้ Event lock เดียวกัน จึงไม่มีทางที่ ACTIVE count > capacity หลัง commit ไม่ว่าคำขอใดมาก่อน

### Feature design (SDS)

**State transition:** F-07 ไม่เปลี่ยน status ของ Event (DRAFT/PUBLISHED/CLOSED คงเดิมหลังแก้) สถานะเป็นตัวกำหนดว่า field ไหนแก้ได้ตามตารางใน Workflow / UI การเปลี่ยนสถานะยังเป็นของ F-02 (publish) และ F-06 (close)

```
DRAFT ──edit (ทุก field)──▶ DRAFT
PUBLISHED ──edit (title/description/location/capacity)──▶ PUBLISHED
CLOSED ──edit──▶ 409 EVENT_NOT_EDITABLE (ไม่เปลี่ยน)
```

**การเปลี่ยนแปลงต่อ layer:**

| Layer | เปลี่ยน | รายละเอียด |
|---|---|---|
| UI | เปลี่ยน | ปุ่ม **แก้ไขกิจกรรม** ในหน้า owner detail, route ใหม่ `/organizer/events/{id}/edit` ที่ reuse `EventForm` (`client/src/features/events/`) ในโหมดแก้ไข, ข้อความ error ภาษาไทยของ 3 code ใหม่ |
| API | เปลี่ยน | endpoint ใหม่ `PATCH /api/organizer/events/{id}` ใน `server/src/modules/events/router.ts`; validation EventPatch ใน `input.ts` (reuse กฎของ EventInput); logic ใน `service.ts` |
| Data | **no change** | ไม่มี migration, ไม่เพิ่ม column/table ใช้ Event model และ Registration count เดิม |

**Service design:** `service.update(id, organizerId, patch)` ทำใน `db.$transaction` เดียว: `SELECT … FROM events WHERE id=$id AND organizer_id=$organizerId FOR UPDATE` (รูปแบบเดียวกับ `publish`) → ตรวจ status → ตรวจ field เวลาเมื่อ PUBLISHED → รวมค่าแล้วตรวจ BR-02 → ถ้ามี capacity นับ ACTIVE ใน transaction เดียวกัน → `update` → คืน OwnerEvent ด้วย serializer เดิม

**Permissions:**

| ผู้เรียก | ผล |
|---|---|
| Anonymous | 401 AUTH_REQUIRED |
| Participant | 403 ROLE_FORBIDDEN |
| Organizer ที่ไม่ใช่เจ้าของ | 404 EVENT_NOT_FOUND (ไม่เปิดเผยว่ามีกิจกรรมนี้) |
| Organizer เจ้าของ | แก้ได้ตามสถานะและกฎด้านบน |

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-34 | เจ้าของแก้ DRAFT ได้ทุก field ของ EventInput; ได้ 200 OwnerEvent, ค่าอ่านกลับจาก own endpoint ตรงกับที่แก้, owner/status/created_at เดิม, updated_at เปลี่ยน | TEST-45 |
| AC-35 | เจ้าของแก้ title/description/location/capacity ของ PUBLISHED ได้ และ shared list/detail แสดงค่าใหม่; ส่ง field เวลาใด ๆ ได้ 409 FIELD_NOT_EDITABLE โดยข้อมูลไม่เปลี่ยน | TEST-46 |
| AC-36 | แก้ CLOSED ได้ 409 EVENT_NOT_EDITABLE โดยข้อมูลไม่เปลี่ยน | TEST-47 |
| AC-37 | EventPatch ว่าง/ผิด type/null/ยาวเกิน/สั้นเกินหลัง trim/capacity นอก 1–1000/เวลาผิดรูปแบบหรือละเอียดเกิน 3 หลัก/มี system หรือ unknown field ได้ 400; DRAFT ที่ค่ารวมผิดลำดับ BR-02 ได้ 400; ทุกกรณีไม่เปลี่ยนข้อมูล | TEST-48 |
| AC-38 | ลด capacity เท่ากับ ACTIVE count ได้ (boundary); ตั้งเป็น ACTIVE count − 1 ได้ 409 CAPACITY_BELOW_ACTIVE โดยข้อมูลไม่เปลี่ยน; เพิ่ม capacity ของกิจกรรมที่เต็มแล้ว Participant ใหม่ลงทะเบียนได้ | TEST-49 |
| AC-39 | ลด capacity พร้อมกับมีการลงทะเบียนที่นั่งสุดท้าย (คนละ connection) ผลหลัง commit ACTIVE count ≤ capacity เสมอ; คำขอที่ทำทีหลังได้ 409 (EVENT_FULL หรือ CAPACITY_BELOW_ACTIVE) โดยไม่มีผลข้างเคียง และไม่มี deadlock/500 | TEST-50 |
| AC-40 | Anonymous 401, Participant 403, Organizer อื่น 404, ไม่มี/ผิด CSRF 403 และ UI: ฟอร์มเติมค่าเดิม, ช่องเวลา disabled เมื่อ PUBLISHED, ไม่มีปุ่มเมื่อ CLOSED, แสดง error 400/409 เป็นภาษาไทย, หลังบันทึกและ reload เห็นค่าใหม่ | TEST-51, TEST-52 |

DoD F-07 (ครบทุกข้อจึงถือว่าเสร็จ):

1. AC-34–AC-40 ผ่านด้วย test ที่รันจริง (unit, API/DB บน PostgreSQL และ E2E ตาม STS) และบันทึกคำสั่ง, commit และจำนวน passed/failed/skipped
2. TDD evidence: commit ที่มี test ใหม่ซึ่ง fail ด้วย assertion จริงก่อน implement (RED) และ commit ที่ test เดียวกันผ่าน (GREEN) พร้อม SHA ทั้งสอง
3. Sprint 1 automated regression ผ่านทั้งหมด
4. System SDS (error table, API list), features.md และ traceability อัปเดตตรงกับของจริง
5. Trace ได้ครบ: Issue #48 → branch `feature/48-…` จาก `sprint-2-staging` → PR ที่ teammate review แบบมีเนื้อหา + CI `test-and-docker` ผ่าน → merge เข้า `sprint-2-staging` → อยู่ใน Sprint 2 release บน `main` ที่ deploy แล้วและติด tag (เช่น `v2.0.0-sprint-2`) ให้ระบุได้แม้ candidate ภายหลังจะมีงานเพิ่ม
6. มีแถวใน completion table ของ Sprint 2: AC, implementation (ไฟล์/commit), executed verification (test ID), result, accepted release
7. ผ่าน [Product DoD](../sprint-1/README.md) DOD-01–DOD-10 ที่เกี่ยวข้อง (รวม DOD-03 race, DOD-09 ไม่มี secret และเปิดเผยงานไม่ครบ, DOD-10 CI/GCP post-deploy check)

---

## Cross-feature acceptance สำหรับ Sprint 2

| ประเด็น | ต้องตรวจ | ผู้รับผิดชอบ |
|---|---|---|
| ยกเลิกแล้วลด capacity | หลัง cancel ACTIVE count ลด จึงลด capacity ลงได้เท่ากับยอดใหม่ แต่ยังไม่น้อยกว่า 1 (F-06 × F-07) | M1 + M2 (TEST-44; pending จน cancel และ capacity edit พร้อมทั้งคู่) |
| ปิดกิจกรรมแล้วแก้ | close แล้ว PATCH ได้ EVENT_NOT_EDITABLE (F-06 × F-07) | M2 (TEST-47 ใช้ event ที่ปิดผ่าน F-06 เมื่อพร้อม; ก่อนหน้านั้นใช้ fixture CLOSED) |
| Sprint 1 regression | automated tests ของ Sprint 1 (TEST-01–TEST-30, TEST-32, TEST-33, TEST-36) ยังผ่านทั้งหมดใน CI; TEST-31/34/35 เป็น manual ทำตอนเตรียม release | ทั้งคู่ |

## Revision history

กฎ: version ที่ merge เข้า `sprint-2-staging` ก่อนเริ่มเขียนโค้ดคือ baseline ของ contract/test design การแก้หลังจากนั้นต้องเพิ่มแถวใหม่ระบุ AC/TEST ที่เปลี่ยนและ **เหตุผล** (เช่น พบระหว่าง TDD ว่ากฎขัดกับ BR) ห้ามเขียนทับแถวเดิมหรือ force-push ประวัติ (D2 §3.2 "versioned contract/test-design history … justified revisions")

| Version | วันที่ | การเปลี่ยนแปลง | เหตุผล | ผู้เขียน |
|---|---|---|---|---|
| 0.1 | 23 พ.ย. 2026 | ร่างส่วนร่วม, การจองเลข ID และ F-07 ครบ; F-06 รอ M1 | ฉบับแรกก่อน implementation | M2 |
| 0.2 | 23 พ.ย. 2026 | เติม F-06, AC-28–33, ALREADY_CANCELLED, response/migration/history และ lock/precedence; F-07 และ IDs เดิมไม่เปลี่ยน | ทำส่วน F-06 ของ #46 ให้พร้อม review ก่อน implementation #47; ยึด FR-09–10/12 และ BR-03–11/14 | M1 |
| 0.3 | 24 พ.ย. 2026 | ระบุ own-registration lookup ผ่าน GET เดิม, ใช้ label registered_at ให้ตรงทั้ง own/roster และรวม regression assertions ใน DoD; เพิ่มตัวอย่าง release tag | แก้ข้อเสนอแนะก่อน approve PR #56 ให้ implementation/test expectations ชัดเจนและสอดคล้องกัน | M1 |
| 0.4 | 24 พ.ย. 2026 | ระบุ REGISTERED history ใน seed/demo-data หลัง migration, UUID ของ SQL backfill และ UI ของ CANCELLED เมื่อเต็ม/ปิดรับ; ใช้สถานะ planned ที่ไม่อ้างรอ review | แก้ข้อเสนอแนะ PR #56 ให้ lifecycle ครบทั้ง legacy และ fresh DB และข้อความยังถูกต้องหลัง merge | M1 |
| 0.5 | 24 พ.ย. 2026 | เพิ่ม linked NFR-01/03/04/05/06 และ mapping ไป TEST-41/43/42/44(a)/41 ตามลำดับ | เติม linked FR/BR/NFR ของ F-06 ให้ครบตาม D2 §3.2 จากข้อเสนอแนะ PR #56 | M1 |
| 0.6 | 24 พ.ย. 2026 | F-07 UI: คำอธิบาย capacity แสดงเฉพาะ PUBLISHED; กำหนดข้อความสำเร็จหลังบันทึก "บันทึกการแก้ไขแล้ว"; ไม่เปลี่ยน API, AC หรือ TEST IDs | ระหว่าง implement #48 พบว่าคำอธิบายบน DRAFT จะเป็น "ไม่ต่ำกว่า 0" ซึ่งขัดกับขั้นต่ำ 1 ของ BR-01 และ v0.5 ไม่ได้ระบุข้อความสำเร็จ จึงระบุให้ตรวจได้ใน TEST-52 | M2 |
| 0.6 | 24 พ.ย. 2026 | อัปเดตสถานะ F-06 และลิงก์ completion/evidence; ระบุ actual process restart และ TEST-44(c) แยก PR; AC/TEST/FR/BR และ F-07 คงเดิม | reconcile design กับ implementation/local runs โดยไม่อ้างว่า CI/review/merge/release ผ่านแล้ว | M1 |
| 0.7 | 24 พ.ย. 2026 | รวม revision v0.6 ของ M1/F-06 และ M2/F-07 จากสอง branch โดยเก็บทั้งสองแถว; คง AC/TEST IDs และการแก้ F-07 ทุกข้อ | แก้ merge conflict หลังรวม sprint-2-staging เข้า feature/47-f06; TEST-44(c) ยังแยก PR และผลหลัง merge บันทึกแยกจากผลเดิม | M1 |
| 0.8 | 24 พ.ย. 2026 | อัปเดตสถานะ: TEST-44(c) และ TEST-47/52 (close จริงของ F-06) รันแล้วใน PR integration; ไม่เปลี่ยน AC, API, TEST IDs หรือ expected | หลัง #59/#57 เข้า sprint-2-staging ทำ cross-feature ตามตาราง Cross-feature acceptance ได้แล้ว (M1 ตกลงให้ M2 เขียน TEST-44(c)) | M2 |
