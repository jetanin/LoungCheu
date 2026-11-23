# Sprint 2 — Feature Engineering Contracts (F-06, F-07)

เอกสาร LC-S2-CONTRACT | v0.1 (draft for review) | 23 พฤศจิกายน 2026

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
| — | (F-06 เพิ่มเอง) | | F-06 |

---

## F-06 — Cancel, re-register และ close event

**Links:** FR-09–10, FR-12; BR-03–11, BR-14; V2-01, V2-02, V2-04; dependency: F-03–05

> ส่วนนี้ M1 เป็นผู้เขียน ใช้โครงเดียวกับ F-07 ด้านล่าง: Workflow/UI → API/data contract (รวม migration `cancelled_at` และ `RegistrationHistory`) → Feature design (SDS) พร้อม state transition และตาราง UI/API/Data → validation/errors/permissions → Acceptance Criteria AC-28–AC-33 → DoD 7 ข้อ เขียนใน PR แยก (`doc/46-f06-contract`) หลัง PR ของส่วนร่วม + F-07 merge แล้ว

---

## F-07 — Edit event details และ capacity

**Links:** FR-11; BR-01–02, BR-05, BR-07, BR-09–11, BR-14; NFR-01, NFR-03, NFR-06; V2-03; dependency: F-02 (event/owner routes), F-03 (ACTIVE count และ Event lock)

หมายเหตุ traceability: [features.md](../../features.md) ระบุ F-07 = BR-01–02,07,10–11,14 เอกสารนี้เพิ่ม BR-05 (ACTIVE ≤ capacity ระหว่างลด capacity ตรงกับ traceability แถว BR-05) และ BR-09 (CLOSED แก้ Event fields ไม่ได้) ต้องอัปเดต features.md และแถว BR-09 ใน traceability ให้ตรงใน #51

### Workflow / UI

Organizer เปิดกิจกรรมของตน (`/organizer/events/{id}`) → กด **แก้ไขกิจกรรม** → ฟอร์มเติมค่าปัจจุบันไว้ → แก้ค่า → กด **บันทึกการแก้ไข** → กลับหน้ารายละเอียดพร้อมข้อความสำเร็จและค่าที่อ่านกลับจาก server

สิ่งที่แก้ได้ขึ้นกับสถานะ (FR-11, BR-09, BR-11):

| Status | แก้ได้ | แก้ไม่ได้ |
|---|---|---|
| DRAFT | ทุก field ใน EventInput: title, description, location, capacity, starts_at, ends_at, registration_closes_at | id, organizer_id, status, created_at, updated_at |
| PUBLISHED | title, description, location, capacity | starts_at, ends_at, registration_closes_at และ system fields |
| CLOSED | ไม่มี (ไม่แสดงปุ่มแก้ไข) | ทุก field |

UI rules:

- ปุ่ม **แก้ไขกิจกรรม** แสดงเฉพาะ DRAFT/PUBLISHED บนหน้า owner detail เปิด `/organizer/events/{id}/edit`
- PUBLISHED: ช่องเวลาทั้งสามแสดงค่าเดิมแบบ disabled พร้อมข้อความ "เผยแพร่แล้ว แก้เวลาไม่ได้"
- ช่อง capacity แสดงคำอธิบาย "มีผู้ลงทะเบียน ACTIVE n คน ตั้งได้ไม่ต่ำกว่า n" (ค่า n จาก `active_count` ตอนเปิดฟอร์ม) เป็นคำอธิบายเท่านั้น ไม่บล็อกการกดบันทึก เพราะยอดอาจเปลี่ยนระหว่างแก้ server เป็นผู้ตัดสิน
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
| ยกเลิกแล้วลด capacity | หลัง cancel ACTIVE count ลด จึงลด capacity ลงได้เท่ากับยอดใหม่ (F-06 × F-07) | M1 + M2 (เพิ่มเป็น test ในช่วง TEST-37–44 ของ F-06 เมื่อ cancel พร้อม เพราะต้องใช้ endpoint ของ F-06) |
| ปิดกิจกรรมแล้วแก้ | close แล้ว PATCH ได้ EVENT_NOT_EDITABLE (F-06 × F-07) | M2 (TEST-47 ใช้ event ที่ปิดผ่าน F-06 เมื่อพร้อม; ก่อนหน้านั้นใช้ fixture CLOSED) |
| Sprint 1 regression | automated tests ของ Sprint 1 (TEST-01–TEST-30, TEST-32, TEST-33, TEST-36) ยังผ่านทั้งหมดใน CI; TEST-31/34/35 เป็น manual ทำตอนเตรียม release | ทั้งคู่ |

## Revision history

กฎ: version ที่ merge เข้า `sprint-2-staging` ก่อนเริ่มเขียนโค้ดคือ baseline ของ contract/test design การแก้หลังจากนั้นต้องเพิ่มแถวใหม่ระบุ AC/TEST ที่เปลี่ยนและ **เหตุผล** (เช่น พบระหว่าง TDD ว่ากฎขัดกับ BR) ห้ามเขียนทับแถวเดิมหรือ force-push ประวัติ (D2 §3.2 "versioned contract/test-design history … justified revisions")

| Version | วันที่ | การเปลี่ยนแปลง | เหตุผล | ผู้เขียน |
|---|---|---|---|---|
| 0.1 | 23 พ.ย. 2026 | ร่างส่วนร่วม, การจองเลข ID และ F-07 ครบ; F-06 รอ M1 | ฉบับแรกก่อน implementation | M2 |
