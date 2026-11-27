# Sprint 3 — Feature Engineering Contracts (F-08, F-09)

เอกสาร LC-S3-CONTRACT | v0.3 (design + local implementation status) | 27 พฤศจิกายน 2026

ฐานของ Sprint 3: `sprint-3-staging` แตกจาก `main` หลัง release Sprint 2 ใช้ SRS/System SDS baseline v0.5 และ IDs เดิมตาม [traceability](../../traceability.md) เอกสารนี้ต้อง merge เข้า `sprint-3-staging` **ก่อน** เริ่มเขียนโค้ด F-08/F-09 (D2 §3.3 "contracts … with enough UI/API/data detail to control implementation")

Test design แยกอยู่ใน [sts.md](sts.md)

## สถานะงาน

| Feature | Issue | สถานะ | หมายเหตุ |
|---|---|---|---|
| F-08 Check-in และ own attendance status | #50 | tested (local) | M1 implement ตาม design baseline v0.2; TEST-53–59, TEST-65–66 มี local evidence แล้ว ([ผลและ TDD trace](evidence/f08-ui-green/README.md)); ยังรอ PR/CI/teammate review/staging/release acceptance |
| F-09 Attendance summary | #74 | in progress | Issue #74 สร้าง 26 พ.ย.; owner M2 (i3artuf) ให้ทันอยู่ใน D2 candidate; ใช้คอลัมน์ checked_in_at จาก migration ของ F-08 |

ใช้สถานะ planned → in progress → implemented → tested → accepted ตามหลักฐานจริงเท่านั้น contract/STS ไม่ใช่ผล PASS

## การจองเลข ID

| Feature | AC | Tests | ผู้เขียน contract | Reviewer |
|---|---|---|---|---|
| F-08 Check-in และ own attendance | AC-41–AC-46 | TEST-53–TEST-59, TEST-65–TEST-66 | M2 (i3artuf) | M1 |
| F-09 Attendance summary | AC-47–AC-50 | TEST-60–TEST-64 | M2 (i3artuf) | M1 |

เลขที่จองแต่ไม่ได้ใช้ให้เขียนว่า "unused" ไม่เลื่อนเลขของอีก feature

## สิ่งที่ใช้ร่วมกันใน Sprint 3

- ใช้ schema `{ "data": ... }`, error schema, CSRF header, Timestamp/ID/EmptyInput และลำดับตรวจ auth → role → CSRF → input → record scope → domain ตาม [Sprint 1 contracts](../sprint-1/contracts.md) และ [Sprint 2 contracts](../sprint-2/contracts.md) ไม่เปลี่ยน
- Check-in เป็น Registration mutation จึง lock แถว Event ก่อน แล้วจึง lock Registration ตามลำดับ Event → Registration เดียวกับ register/cancel/close/edit (BR-10) และอ่าน server clock หลังได้ Event lock (BR-14)
- Error codes ใหม่ของ Sprint 3 (เพิ่มในตาราง error ของ System SDS ใน PR เดียวกับ implementation):

| HTTP | Code | ใช้เมื่อ | Feature |
|---|---|---|---|
| 409 | CHECK_IN_NOT_OPEN | server_now อยู่นอก `starts_at <= now <= ends_at` | F-08 |
| 409 | REGISTRATION_NOT_ACTIVE | เช็กชื่อ Registration ที่เป็น CANCELLED | F-08 |
| 409 | ALREADY_CHECKED_IN | เช็กชื่อ Registration ที่มี checked_in_at แล้ว (System SDS วางไว้ตั้งแต่ baseline) | F-08 |

F-08 ใช้ `EVENT_NOT_FOUND` และ `REGISTRATION_NOT_FOUND` เดิมสำหรับ record scope ส่วน F-09 ไม่มี error code ใหม่

---

## F-08 — Check-in และ own attendance status

**Links:** FR-13, FR-14; BR-06, BR-07, BR-09, BR-12, BR-14; NFR-01, NFR-03, NFR-04, NFR-05, NFR-06; V3-01, V3-02; dependency: F-04, F-05, F-06 (CLOSED/CANCELLED), F-07 (เวลาเริ่ม/สิ้นสุด)

**NFR → planned verification** (ยังไม่ใช่ผลรันทดสอบ):

| NFR | ขอบเขตใน F-08 | Planned tests |
|---|---|---|
| NFR-01 | Access matrix ของ check-in และ own attendance: auth/role/ownership/CSRF ไม่เปิดเผยข้อมูลข้ามผู้ใช้ | TEST-57 |
| NFR-03 | checked_in_at/checked_in_by_id อ่านกลับได้หลัง reload และ re-login (TEST-59) และหลังหยุดแล้วเริ่ม backend process ใหม่บน DB เดิม (TEST-66) ตาม SRS NFR-03 "หลัง restart แอป" | TEST-59, TEST-66 |
| NFR-04 | เช็กชื่อคนเดียวกันพร้อมกันสำเร็จครั้งเดียว ข้อมูลไม่ถูกเขียนทับ | TEST-58 |
| NFR-06 | Error code/message ภาษาไทยตาม contract และไม่เปิดเผยข้อมูลภายใน | TEST-55, TEST-57 |
| NFR-05 | Migration S2→S3 คงข้อมูลเดิม, fresh migrate→seed และ seed ซ้ำ, constraint ของสองคอลัมน์ใหม่ | TEST-65 |

### Workflow / UI

Organizer เปิดรายละเอียดกิจกรรมของตน → ดู roster → ตรวจตัวผู้เข้าร่วมหน้างานเอง (SRS: ไม่มี QR) → กด **เช็กชื่อ** ในแถวของคนนั้น → ยืนยัน → แถวแสดง **เช็กชื่อแล้ว** พร้อมเวลา และยอด checked-in เพิ่ม Participant เปิดรายละเอียดการลงทะเบียนของตน → เห็นสถานะการเข้าร่วม

UI rules:

- Roster เพิ่มคอลัมน์ **การเข้าร่วม**: ACTIVE ที่ยังไม่เช็กชื่อแสดงปุ่ม **เช็กชื่อ** เมื่อเวลาเครื่องอยู่ในช่วง `starts_at`–`ends_at` นอกช่วงแสดง "เช็กชื่อได้ระหว่าง {starts_at}–{ends_at}" (Asia/Bangkok) ไม่มีปุ่ม; เช็กชื่อแล้วแสดง "เช็กชื่อแล้ว {checked_in_at}"; CANCELLED แสดง "—" ไม่มีปุ่ม server เป็นผู้ตัดสินเมื่อกดจริง
- หัว roster เพิ่ม "เช็กชื่อแล้ว {checked_in_count} / ACTIVE {active_count} คน"
- กดเช็กชื่อแล้วต้องยืนยันด้วย dialog ที่มีชื่อผู้เข้าร่วม ("ยืนยันเช็กชื่อ {display_name}?") การยกเลิก dialog ไม่ส่ง mutation
- ระหว่างส่งให้ปุ่มของแถวนั้นเป็น "กำลังเช็กชื่อ…" และ disabled; หลังสำเร็จอัปเดตแถวจาก response แล้วโหลด roster ใหม่จาก server เพื่อให้ยอดตรง DB
- 409 แสดงข้อความตามตารางด้านล่างแล้วโหลด roster ใหม่; 401 ล้างข้อมูลส่วนตัวและกลับ login; 403/404 ล้าง roster และแสดง error ไม่แสดงข้อมูลเดิม
- network timeout ที่ไม่รู้ว่า commit หรือยัง: ห้าม retry อัตโนมัติ แสดง "ยังยืนยันผลไม่ได้ กรุณาโหลดรายชื่อใหม่ก่อนเช็กชื่อซ้ำ" พร้อมปุ่ม **โหลดรายชื่อใหม่**
- Own detail และ own list ของ Participant เพิ่มบรรทัด **การเข้าร่วม**: "เช็กชื่อแล้วเมื่อ {checked_in_at}" หรือ "ยังไม่ได้เช็กชื่อ" (เฉพาะ ACTIVE); CANCELLED ไม่แสดงบรรทัดนี้ ไม่แสดงตัวตนของ Organizer ที่เช็กชื่อ

| Code | ข้อความ UI |
|---|---|
| CHECK_IN_NOT_OPEN | เช็กชื่อได้เฉพาะระหว่างเวลาเริ่มถึงเวลาสิ้นสุดกิจกรรม |
| REGISTRATION_NOT_ACTIVE | รายการนี้ถูกยกเลิกแล้ว เช็กชื่อไม่ได้ |
| ALREADY_CHECKED_IN | ผู้เข้าร่วมคนนี้เช็กชื่อแล้ว |
| EVENT_NOT_FOUND / REGISTRATION_NOT_FOUND | ไม่พบกิจกรรมนี้ / ไม่พบรายการลงทะเบียนนี้ |

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| POST /api/organizer/events/{eventId}/registrations/{registrationId}/check-in | EmptyInput; organizer จาก session | 200 data: RosterEntryS3 ของแถวที่เช็กชื่อ | 400 INVALID_INPUT; 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN / CSRF_FAILED; 404 EVENT_NOT_FOUND / REGISTRATION_NOT_FOUND; 409 CHECK_IN_NOT_OPEN / REGISTRATION_NOT_ACTIVE / ALREADY_CHECKED_IN |
| GET /api/organizer/events/{id}/registrations (ขยาย F-05) | — | 200 data: RosterS3 | เดิมตาม F-05 |
| GET /api/my/registrations, /api/my/registrations/{id} (ขยาย F-04) | — | 200 data: MyRegistrationS3 / MyRegistrationS3[] | เดิมตาม F-04 |

Parser budget ใช้ Registration 1 KiB; body ที่ไม่ใช่ EmptyInput รวม `checked_in_at`, `checked_in_by_id`, `participant_id`, `status` ตอบ 400 INVALID_INPUT

**Response schemas:**

- `RosterEntryS3` = RosterEntry เดิมพร้อม `checked_in_at: Timestamp | null` ที่ required ไม่คืน checked_in_by_id
- `RosterS3` = Roster เดิมพร้อม `checked_in_count: integer` (ACTIVE ที่ checked_in_at ไม่เป็น null) และ registrations เป็น RosterEntryS3[] เรียง registered_at ASC, id ASC เหมือนเดิม
- `MyRegistrationS3` = MyRegistrationS2 พร้อม `checked_in_at: Timestamp | null` ที่ required
- CANCELLED มี checked_in_at=null เสมอ เพราะ check-in เกิดได้หลัง starts_at ซึ่งไม่ก่อน registration_closes_at (BR-02) จึงไม่มี cancel หรือ reactivate หลังเช็กชื่อ (BR-03, F-06)

**ลำดับ check-in** (ใช้เหตุผลแรกที่เจอ):

1. auth → role ORGANIZER → CSRF → path UUID ทั้งสองตัวและ EmptyInput; input ผิดตอบ 400
2. lock Event ด้วย `id = eventId AND organizer_id = session` (`SELECT … FOR UPDATE`); ไม่พบ/ไม่ใช่เจ้าของตอบ 404 EVENT_NOT_FOUND
3. lock Registration ด้วย `id = registrationId AND event_id = eventId`; ไม่พบหรืออยู่คนละกิจกรรมตอบ 404 REGISTRATION_NOT_FOUND
4. อ่าน server clock หลังได้ lock; นอก `starts_at <= clock <= ends_at` ตอบ 409 CHECK_IN_NOT_OPEN (ทั้งสองขอบรวม ตาม BR-12) ไม่ตรวจ Event status เพราะ PUBLISHED และ CLOSED เช็กชื่อได้ (BR-09) และ DRAFT ไม่มี Registration
5. Registration=CANCELLED ตอบ 409 REGISTRATION_NOT_ACTIVE
6. checked_in_at ไม่เป็น null ตอบ 409 ALREADY_CHECKED_IN
7. ตั้ง `checked_in_at = clock`, `checked_in_by_id = session organizer` แล้ว commit ก่อนคืน 200

ตรวจเวลาก่อนสถานะของ record เพื่อให้คำขอนอกช่วงได้คำตอบเดียวกันไม่ว่า record จะเป็นแบบไหน (แนวเดียวกับ F-06 ที่ตรวจ REGISTRATION_CLOSED ก่อน ALREADY_CANCELLED) ทุก rejection ต้องไม่เปลี่ยน Event/Registration/history รวม updated_at; check-in สำเร็จไม่แก้ Event.updated_at, status, registered_at หรือ cancelled_at

**Data / migration:**

| ส่วน | การเปลี่ยนแปลง |
|---|---|
| Registration | เพิ่ม `checked_in_at` nullable `timestamptz(3)` และ `checked_in_by_id` nullable UUID FK → users (Restrict) ตาม System SDS |
| Constraint | SQL CHECK `(checked_in_at IS NULL) = (checked_in_by_id IS NULL)` และ CHECK `checked_in_at IS NULL OR status = 'ACTIVE'` |
| RegistrationHistory | **no change**: check-in ไม่ append history เพราะ history เก็บ lifecycle ของสถานะ (BR-13) ส่วน checked_in_at/checked_in_by_id เป็นหลักฐานการเช็กชื่อในตัว |
| Backfill | ไม่มี; record เดิมทั้งหมดเป็น null (ยังไม่เคยเช็กชื่อ) |
| Seed / demo data | เพิ่มกิจกรรม `[DEMO]` สำหรับเช็กชื่อ 1 รายการ: closes=starts=วัน seed 00:00 Asia/Bangkok, ends=+7 วัน เพื่อให้สาธิตได้ตลอดสัปดาห์หลัง seed (เลยจากนั้นจะเป็นนอกช่วงตาม BR-12 ซึ่งถือว่าถูกต้อง) มี ACTIVE 2 record เช็กชื่อแล้ว 1; seed ซ้ำข้าม Event เดิม ไม่ทับค่าเช็กชื่อ ตามแนว demo seed เดิม |

### Feature design (SDS)

**State:**

```
ACTIVE, checked_in_at=null ──check-in [เจ้าของ, starts_at ≤ now ≤ ends_at]──▶ ACTIVE, checked_in_at=now, checked_in_by_id=organizer
ACTIVE, checked_in_at≠null ──check-in──▶ 409 ALREADY_CHECKED_IN (ค่าเดิม)
CANCELLED ──check-in──▶ 409 REGISTRATION_NOT_ACTIVE
```

ไม่มีการยกเลิกการเช็กชื่อใน baseline (ไม่มี FR) หากผู้จัดกดผิดถือเป็นข้อจำกัดที่บันทึกไว้

| Layer | เปลี่ยน | รายละเอียด |
|---|---|---|
| UI | เปลี่ยน | Roster ใน owner detail เพิ่มคอลัมน์/ปุ่มเช็กชื่อและยอด checked-in; own list/detail เพิ่มสถานะการเข้าร่วม; ใช้ confirmation/busy/uncertain pattern เดียวกับ `LifecycleMutation` ของ F-06 |
| API | เพิ่ม | module `attendance` (System SDS §2): router check-in และ service; ขยาย serializer ของ roster และ own registration |
| Data | เปลี่ยน | migration เพิ่ม 2 คอลัมน์และ CHECK ตามตารางด้านบน; Event และ history **no change** |

**Service design:** Prisma interactive transaction แบบ READ COMMITTED ใช้ transaction client เดียว lock Event (scoped owner) → lock Registration (scoped event) → clock → ตรวจตามลำดับ → update → serialize ภายใต้ lock แล้ว commit

**Concurrency:** เช็กชื่อ record เดียวกันพร้อมกัน (สองแท็บของ OA) สำเร็จหนึ่ง อีกหนึ่ง ALREADY_CHECKED_IN และ checked_in_at เป็นของผู้ชนะ; check-in แข่งกับ close หรือ capacity edit ไม่กระทบกันเพราะ lock Event ตามลำดับเดียวกัน; คำขอที่รอ lock จนเลย ends_at ถูกปฏิเสธ CHECK_IN_NOT_OPEN แม้ส่งมาก่อน

**Permissions:**

| ผู้เรียก | Check-in | Roster (S3) | Own attendance |
|---|---|---|---|
| Anonymous | 401 AUTH_REQUIRED | 401 | 401 |
| Participant | 403 ROLE_FORBIDDEN (รวมเช็กชื่อตัวเอง) | 403 | ของตนเท่านั้น; คนอื่น 404 |
| Organizer เจ้าของ | ได้ตามกฎ | ได้ | 403 |
| Organizer อื่น | 404 EVENT_NOT_FOUND | 404 | 403 |

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-41 | เจ้าของเช็กชื่อ ACTIVE ในช่วงกิจกรรมได้ 200 พร้อม checked_in_at=clock หลัง lock และ checked_in_by_id=organizer ใน DB; roster เห็นแถวเช็กชื่อแล้วและ checked_in_count เพิ่ม 1; status/registered_at/Event.updated_at เดิม | TEST-53 |
| AC-42 | ขอบเวลา: starts_at−1 ms และ ends_at+1 ms ได้ 409 CHECK_IN_NOT_OPEN; starts_at และ ends_at พอดีสำเร็จ; CLOSED ในช่วงงานเช็กชื่อได้ | TEST-54 |
| AC-43 | CANCELLED ได้ REGISTRATION_NOT_ACTIVE; เช็กชื่อซ้ำได้ ALREADY_CHECKED_IN; ทุก rejection ไม่เปลี่ยน checked_in_at/checked_in_by_id/ยอด | TEST-55 |
| AC-44 | Anonymous 401, Participant 403 (รวมเช็กชื่อตัวเอง), Organizer อื่น 404, Registration ของกิจกรรมอื่น 404, CSRF ผิด 403, path/body ผิด 400 | TEST-56, TEST-57 |
| AC-45 | Participant เห็นสถานะการเข้าร่วมของตนใน own list/detail (เช็กชื่อแล้วพร้อมเวลา/ยังไม่ได้เช็กชื่อ) และอ่านของคนอื่นไม่ได้ | TEST-57, TEST-59 |
| AC-46 | เช็กชื่อคนเดียวกันพร้อมกันสำเร็จครั้งเดียวไม่มี deadlock/500; UI ยืนยันก่อนส่ง, busy, 409 ภาษาไทยและโหลดใหม่, ค่าคงอยู่หลัง reload/re-login | TEST-58, TEST-59 |

DoD F-08 (ครบทุกข้อจึงถือว่าเสร็จ):

1. AC-41–AC-46 ผ่านด้วย test ที่รันจริงตาม TEST-53–59 และ TEST-65–66 บันทึกคำสั่ง, commit, passed/failed/skipped
2. มี meaningful RED ก่อน implementation และ GREEN ของ test เดียวกันพร้อม SHA
3. Regression ของ Sprint 1–2 ผ่าน; ปรับ expected schema เฉพาะ field ที่เพิ่ม (checked_in_at, checked_in_count) โดยไม่ลด assertion เดิม
4. migration ผ่านบน test DB และ fresh DB → migrate → seed ตาม TEST-65; อัปเดต System SDS (schema/API/error table/UI) และ traceability (FR-13–14, BR-09/12 เพิ่ม F-08, NFR-04 เพิ่ม TEST-58) ใน PR เดียวกันหรือ #51
5. Trace: #50 → `feature/50-…` จาก `sprint-3-staging` → PR ที่ teammate review + CI ผ่าน → staging → release
6. ผ่าน [Product DoD](../sprint-1/README.md) ข้อที่เกี่ยวข้อง

---

## F-09 — Attendance summary

**Links:** FR-15; BR-07, BR-13; NFR-01, NFR-06; V3-03; dependency: F-05, F-06 (CANCELLED/reactivate), F-08 (checked_in_at)

**NFR → planned verification:**

| NFR | ขอบเขตใน F-09 | Planned tests |
|---|---|---|
| NFR-01 | Summary อ่านได้เฉพาะเจ้าของกิจกรรม | TEST-63 |
| NFR-06 | Error format และ UI loading/empty/error ตามที่ออกแบบ | TEST-63, TEST-64 |

### Workflow / UI

Organizer เปิดรายละเอียดกิจกรรมของตน → กด **ดูสรุปผล** → หน้า `/organizer/events/{id}/summary` แสดงยอด ACTIVE, CANCELLED, เช็กชื่อแล้ว และอัตราเข้าร่วม พร้อมเวลาที่อ่านข้อมูล

UI rules:

- แสดง 4 ช่อง: **ลงทะเบียนอยู่ (ACTIVE)**, **ยกเลิก (CANCELLED)**, **เช็กชื่อแล้ว**, **อัตราเข้าร่วม** เป็น `{attendance_rate}%` และบรรทัด "เช็กชื่อแล้ว {checked_in_count} จาก ACTIVE {active_count} คน"
- ACTIVE=0 แสดง 0.00% พร้อม "ยังไม่มีผู้ลงทะเบียน ACTIVE" ไม่ซ่อนตัวเลข
- มีปุ่ม **รีเฟรชสรุป** และแสดง "ข้อมูล ณ {generated_at}" (Asia/Bangkok) ยอดไม่ auto-refresh
- loading ใช้ placeholder ไม่แสดง 0 ก่อนได้ข้อมูล; error มีปุ่มลองใหม่; 401 กลับ login; 403/404 ล้างข้อมูลและแสดง error
- มีลิงก์กลับไปหน้ารายละเอียดกิจกรรม; ใช้ได้ทุกสถานะ (DRAFT แสดงศูนย์ทั้งหมด)

### API / data contract

| Method / path | Success | Failure |
|---|---|---|
| GET /api/organizer/events/{id}/summary | 200 data: AttendanceSummary | 400 INVALID_INPUT (path); 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN; 404 EVENT_NOT_FOUND เมื่อไม่มีหรือไม่ใช่เจ้าของ |

`AttendanceSummary` = `{ event_id: ID, status: EventStatus, capacity: integer, active_count: integer, cancelled_count: integer, checked_in_count: integer, attendance_rate: string, generated_at: Timestamp }`

กฎการคำนวณ (BR-13):

- active_count / cancelled_count นับ Registration ตาม status ปัจจุบัน; reactivate ย้ายจาก CANCELLED ไป ACTIVE ไม่สะสมจำนวนครั้ง และไม่ใช้ RegistrationHistory นับ
- checked_in_count นับ ACTIVE ที่ checked_in_at ไม่เป็น null
- `attendance_rate` = checked_in_count / active_count × 100 ปัดครึ่งขึ้น (half-up) ทศนิยม 2 ตำแหน่ง คืนเป็น string 2 ตำแหน่งเสมอ เช่น `"66.67"`, `"3.13"`, `"100.00"`; active_count=0 คืน `"0.00"` คำนวณด้วยจำนวนเต็ม (`floor((checked × 10000 × 2 + active) / (active × 2))` แล้วแบ่งเป็นส่วนจำนวนเต็ม/ทศนิยม) ไม่ใช้ float เพื่อไม่ให้ปัดผิด
- ทุกยอดมาจาก snapshot เดียว (SQL เดียวที่ใช้ `COUNT(*) FILTER (…)` หรือ transaction REPEATABLE READ) และ generated_at เป็น server clock ตอนอ่าน

ไม่มี database schema ใหม่ ใช้ Registration ของ F-06/F-08

### Feature design (SDS)

| Layer | เปลี่ยน | รายละเอียด |
|---|---|---|
| UI | เพิ่ม | หน้า summary และลิงก์ดูสรุปผลจาก owner detail |
| API | เพิ่ม | summary query ใน module `attendance`; owner filter บน Event ก่อน aggregate |
| Data | no change | read-only aggregate |

**Permissions:** Anonymous 401; Participant 403 ROLE_FORBIDDEN; Organizer อื่น/ไม่มี Event 404 EVENT_NOT_FOUND; เจ้าของอ่านได้ทุกสถานะ

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-47 | ยอด ACTIVE/CANCELLED/checked-in ตรงกับ DB ตามสถานะปัจจุบัน รวมกรณี cancel แล้ว reactivate (นับเป็น ACTIVE 1 ไม่นับ CANCELLED) และ CANCELLED ไม่นับใน checked-in | TEST-60 |
| AC-48 | attendance_rate ปัด half-up 2 ตำแหน่งเป็น string: 2/3→"66.67", 1/32→"3.13", 3/3→"100.00", ACTIVE=0→"0.00" | TEST-61 |
| AC-49 | หลัง check-in/cancel/reactivate แล้วอ่านใหม่ ยอดเปลี่ยนตรง DB ทันที; DRAFT ได้ศูนย์ทั้งหมด | TEST-62 |
| AC-50 | Anonymous 401, Participant 403, Organizer อื่น 404 ไม่เปิดเผยยอด; UI แสดงยอด/0.00%/loading/error/รีเฟรช ตามที่ออกแบบ | TEST-63, TEST-64 |

DoD F-09 (ครบทุกข้อจึงถือว่าเสร็จ):

1. AC-47–AC-50 ผ่านด้วย test ที่รันจริงตาม TEST-60–64 บันทึกคำสั่ง, commit, passed/failed/skipped
2. มี meaningful RED/GREEN พร้อม SHA
3. Regression ของ Sprint 1–2 และ F-08 ผ่าน
4. อัปเดต System SDS (API/UI) และ traceability (FR-15, BR-13)
5. Trace: implementation issue → feature branch จาก `sprint-3-staging` → PR ที่ teammate review + CI ผ่าน → staging → release
6. ผ่าน [Product DoD](../sprint-1/README.md) ข้อที่เกี่ยวข้อง

---

## Cross-feature acceptance สำหรับ Sprint 3

| ประเด็น | ต้องตรวจ | ผู้รับผิดชอบ |
|---|---|---|
| Close แล้วเช็กชื่อ | CLOSED ในช่วงงานเช็กชื่อได้ (F-06 × F-08) | TEST-54 |
| เวลาที่แก้แล้ว | หลัง F-07 แก้ starts_at/ends_at ของ DRAFT แล้ว publish ช่วงเช็กชื่อใช้ค่าใหม่ | TEST-54 |
| Reactivate กับ summary | cancel → reactivate นับ ACTIVE 1 ไม่นับ CANCELLED (F-06 × F-09) | TEST-60 |
| Check-in กับ summary | เช็กชื่อแล้ว checked_in_count และ rate เปลี่ยนตรง DB (F-08 × F-09) | TEST-62 |
| Regression | automated tests ของ Sprint 1–2 ผ่านทั้งหมดใน CI | ทั้งคู่ |

## Revision history

กฎเดียวกับ [Sprint 2](../sprint-2/contracts.md#revision-history): version ที่ merge เข้า `sprint-3-staging` ก่อนเริ่มเขียนโค้ดคือ baseline การแก้หลังจากนั้นต้องเพิ่มแถวพร้อมเหตุผล ไม่เขียนทับ

| Version | วันที่ | การเปลี่ยนแปลง | เหตุผล | ผู้เขียน |
|---|---|---|---|---|
| 0.1 | 24 พ.ย. 2026 | ฉบับแรก: ส่วนร่วม, การจองเลข ID, F-08 (AC-41–46) และ F-09 (AC-47–50) | ทำ #49 ก่อนเริ่ม implementation #50 | M2 |
| 0.2 | 26 พ.ย. 2026 | F-08: เพิ่ม TEST-65 (migration/constraints, NFR-05) และ TEST-66 (backend restart, NFR-03) ใน Links, NFR table, ID table และ DoD ข้อ 1/4; F-09 สถานะ → #74 in progress. AC-41–50 และ F-09 design ไม่เปลี่ยน | Review PR #71 โดย jetanin: NFR-03 ต้องพิสูจน์หลัง restart ไม่ใช่แค่ reload; DoD อ้าง migration แต่ไม่มี test design; ตาราง F-09 ไม่ตรงกับ #74. แก้ก่อน merge และก่อนเริ่ม implementation #50 | M2 |
| 0.3 | 27 พ.ย. 2026 | อัปเดต F-08 เป็น tested (local) พร้อมลิงก์ evidence/TDD; header ตรง revision ปัจจุบัน | #50 มี implementation/ผลรันจริง; design/AC/API/DoD เดิมไม่เปลี่ยน และไม่อ้าง accepted หรือ CI ของ PR | M1 |
