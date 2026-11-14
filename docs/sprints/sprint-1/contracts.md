# Part E — Sprint 1 Feature Engineering Contracts

**Evidence update — 14 พ.ย. 2026:** PR #7/#10 ได้ teammate review โดย i3artuf และ merge เข้า sprint-1-staging แล้ว ตาม snapshot 12 พ.ย.; PR #10 reviewed head `0bd3468`, merge `97a5b91` (10 พ.ย. 16:26:11 Asia/Bangkok). ผล 159 Vitest / 37 Chromium / typecheck / build / compiled smoke 3 PASS เป็นผลรัน 8 พ.ย. ของ source ที่ commit เป็น `3313288`; รอบแก้เอกสารนี้ไม่ได้รันทดสอบแอปใหม่. OS-process restart, independent clean reproduction/UAT และ reviewed main release ยังขาดหลักฐาน; GAP-02 ยัง OPEN และ Product DoD ยังไม่ครบ. [Review/merge evidence](../../deliverable-1/evidence/review-merge-20261112/README.md). Baseline FR/BR/NFR/AC ไม่เปลี่ยน; F-06–09 อยู่ Sprint 2/3

เอกสาร LC-S1-CONTRACT | Documentation baseline v0.5 | 5 พฤศจิกายน 2026

ใช้ SRS/System SDS baseline v0.5 และ IDs เดิมตาม traceability; F-01–05 implement แล้ว ผลทดสอบอ้าง [tested source3313288](../../registration/views-verification.md). Feature review/staging merge มีหลักฐานแยกจาก main release และ independent process acceptance ซึ่งยัง pending; ไม่มีการเปลี่ยน baseline AC/schema

## Sprint 1 JSON schemas ร่วม

Response fields เป็น required/non-null ใน Sprint 1 Success ครอบด้วย `{ "data": ... }`; list ว่างใช้ `[]`; Logout 204 ไม่มี body Mutations ส่ง CSRF ใน `X-CSRF-Token` ไม่ใส่ใน JSON body ทุก endpoint ใช้ error schema/codes/ลำดับ auth→role→CSRF→input→record scope/domain ตาม System SDS; body/path ผิด=400 INVALID_INPUT และ unexpected failure=500 INTERNAL_ERROR

Technical JSON parser budgets: Auth 16 KiB, Event 32 KiB, Registration 1 KiB; เกิน budget=400 INVALID_INPUT หลัง auth/role/CSRF Event budget รองรับ valid BR-01 text ที่ JSON encode เป็น Unicode surrogate escapes ด้วย Domain field limits ไม่เปลี่ยน

| Type | รูปแบบและข้อจำกัด |
|---|---|
| ID | UUID string ที่ server สร้าง; input path ที่ผิดรูปแบบตอบ 400 INVALID_INPUT หลังผ่าน auth/role; UUID ที่ไม่พบ/อยู่นอก record scope ตอบ 404 ตาม endpoint |
| Timestamp | Input ISO 8601 `YYYY-MM-DDTHH:mm[:ss[.SSS]]` พร้อม Z หรือ ±HH:mm; ไม่ระบุวินาทีได้ (=00) แต่ fractional minutes ไม่รับ; เศษวินาที 0–3 หลัก เกิน 3 หลัก/ไม่มี offset/invalid calendar = 400 INVALID_INPUT; output UTC `YYYY-MM-DDTHH:mm:ss.SSSZ` |
| EmptyInput | {} หรือไม่มี body; ค่าอื่น/field เพิ่มตอบ 400 INVALID_INPUT |
| EventStatus | DRAFT, PUBLISHED หรือ CLOSED |
| RegistrationStatus | ACTIVE ในผลจาก workflow Sprint 1; enum DB เตรียม CANCELLED ไว้สำหรับ Sprint 2 แต่ยังไม่มี action ยกเลิก |

| Schema | Fields / types |
|---|---|
| Identity | id: ID, display_name: string, role: PARTICIPANT หรือ ORGANIZER |
| EventInput | title/description/location: strings หลัง trim นับ code points ตาม BR-01 (well-formed Unicode ไม่มี NUL/unpaired UTF-16 surrogate ที่ PostgreSQL TEXT เก็บไม่ได้); capacity: JSON integer 1–1000; starts_at/ends_at/registration_closes_at: Timestamp ตาม BR-02/14; required ทุก field และไม่ coercion/รับ field เพิ่ม |
| SharedEvent | id: ID; title/description/location: string; capacity: integer; starts_at/ends_at/registration_closes_at: Timestamp; status: PUBLISHED หรือ CLOSED; active_count/available_seats: integer; registration_open: boolean |
| OwnerEvent | fields เหมือน SharedEvent แต่ status อนุญาต DRAFT เพิ่ม และมี organizer_id: ID, created_at: Timestamp, updated_at: Timestamp; DRAFT มี registration_open=false |
| EventSummary | id: ID, title: string, location: string, starts_at/ends_at/registration_closes_at: Timestamp, status: EventStatus |
| RegistrationCreated | id: ID, event_id: ID, status: RegistrationStatus, registered_at: Timestamp |
| MyRegistration | id: ID, status: RegistrationStatus, registered_at: Timestamp, event: EventSummary; ไม่คืนข้อมูล Participant อื่น |
| RosterEntry | id: ID (registration reference); participant: { display_name: string }; status: RegistrationStatus; registered_at: Timestamp |
| Roster | event_id: ID, capacity: integer, active_count: integer, registrations: RosterEntry[] |

`available_seats = capacity - active_count`; `registration_open = status=PUBLISHED AND server_now < registration_closes_at AND available_seats>0` เป็นข้อมูล ณ เวลาอ่าน ไม่รับประกันที่นั่งจน transaction ลงทะเบียน commit `OwnerEvent` ใช้สำหรับ create/publish/owner detail/owner list; shared list/detail ใช้ `SharedEvent`; my list/detail ใช้ `MyRegistration`; roster ใช้ `Roster` ไม่มี schema ใดคืน password_hash หรือ session data

## F-01 — Authentication, identity และ Logout

**Links:** FR-01–02, BR-06–07, NFR-01–02,06; dependency: PostgreSQL session store และ synthetic user seed

### Workflow / UI

ผู้ใช้เปิด /login → รับ CSRF token → กรอก username/password → backend ตรวจ active account → สร้าง session ใหม่และเปิดหน้า /events พร้อมชื่อ/role ผู้ใช้ มี Logout ใน navigation ทั้งสอง role หลัง Logout กลับ Login และ browser ไม่ควรแสดงข้อมูลส่วนตัวค้างใน protected screen

Form ไม่ trim/เปลี่ยน password ที่ผู้ใช้ส่ง ค่า username trim แล้วเทียบ case-sensitive ตาม seed; username/password ต้องเป็น non-empty strings; ปิดปุ่มระหว่างส่ง ข้อมูลผิดแสดงข้อความเดียวกันสำหรับ username ไม่พบ/password ผิด/inactive โดยไม่ยืนยันว่าบัญชีมีอยู่ Session หมดอายุให้ Login ใหม่ ไม่ใช้ client-selected role

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| GET /api/auth/csrf | ไม่มี body | 200 data: { csrf_token: string } ผูก session | — |
| POST /api/auth/login | username/password strings + CSRF header | 200 data: Identity; Set-Cookie session ใหม่ | 400 INVALID_INPUT; 401 INVALID_CREDENTIALS; 403 CSRF_FAILED |
| GET /api/auth/me | Session cookie | 200 data: Identity | 401 AUTH_REQUIRED |
| POST /api/auth/logout | EmptyInput + session cookie + CSRF header | 204, invalidate session และ clear cookie | 401 AUTH_REQUIRED; 403 CSRF_FAILED |

Data: Prisma User model + role/is_active และ PostgreSQL-backed Express session store เก็บ password เป็น scrypt hash พร้อม salt/parameters เท่านั้น ไม่เปลี่ยน domain entities ของ Event/Registration หลัง Login regenerate session และให้ React ขอ CSRF token ใหม่ก่อน mutation ถัดไป Protected endpoints ตรวจ user active ด้วย เพื่อไม่ให้ inactive account ใช้ session เก่าได้

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-01 | Active Participant และ Organizer Login ได้ role ถูกต้อง และ session identifier rotate เมื่อ Login | TEST-01 |
| AC-02 | Missing/empty/wrong-type fields ตอบ 400; wrong password/unknown username/inactive ตอบ 401 โดยไม่สร้าง authenticated session และใช้ generic credential message | TEST-02 |
| AC-03 | /me คืนเฉพาะข้อมูลตัวเอง; ไม่มี session/session หมดอายุ/inactive ตอบ 401 และไม่คืน private data | TEST-03, TEST-06 |
| AC-04 | Logout สำเร็จแล้ว cookie/session เดิมเข้าถึง protected API ไม่ได้ | TEST-04 |
| AC-05 | Salted scrypt hash/cookie ตาม design; Login และ authorized mutation ที่ไม่มี/ผิด CSRF หรือ Origin ผิดถูกปฏิเสธโดยไม่เปลี่ยน domain data | TEST-05 |

DoD: AC-01–05, auth/config tests และ Product DoD

## F-02 — Event creation, publication และ browsing

**Links:** FR-03–05, FR-08 (own list), BR-01–02,07,09,11,14; NFR-01,03,06; dependency: F-01

### Workflow / UI

Organizer เปิดรายการของตน → Create → กรอก title/description/location/capacity/starts_at/ends_at/registration_closes_at → Save เป็น DRAFT → preview → Publish → event ปรากฏในรายการทั่วไป

Shared list เรียง starts_at ASC, id ASC; own list เรียง created_at DESC, id ASC แสดงเวลา Asia/Bangkok และ availability DRAFT อ่านผ่าน owner routes เท่านั้น Shared API ต้อง Login

UI presentation เพิ่มตาม feedback ผู้ใช้: Organizer เปิด `/organizer` จากแท็บภาพรวมได้ โดย reuse `GET /api/organizer/events` แสดงจำนวนกิจกรรมของตนทั้งหมด, DRAFT และ PUBLISHED พร้อมสามรายการล่าสุดตาม own-list order และทางลัด Create/ดูทั้งหมด ไม่มี API/schema/business rule ใหม่ Login ยังไป `/events` ตาม F-01 ตัวเลขนี้เป็นจำนวน Event records ไม่ใช่ยอด Participant/registration/attendance หรือรายงาน F-09

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| POST /api/organizer/events | EventInput + CSRF header | 201 data: OwnerEvent(status=DRAFT), owner จาก session | 400 INVALID_INPUT; 401/403 |
| GET /api/organizer/events | ไม่มี body | 200 data: OwnerEvent[] ของตนรวม DRAFT | 401/403 |
| GET /api/organizer/events/{id} | ไม่มี body | 200 data: OwnerEvent ของตน | 401/403/404 |
| POST /api/organizer/events/{id}/publish | EmptyInput + CSRF header | 200 data: OwnerEvent(status=PUBLISHED) | 409 INVALID_TRANSITION / DEADLINE_PASSED; 401/403/404 |
| GET /api/events | ไม่มี body | 200 data: SharedEvent[] | 401 |
| GET /api/events/{id} | ไม่มี body | 200 data: SharedEvent | 401/404 รวม DRAFT |

Data: สร้าง Event schema/constraints/index/FK owner และ validate EventInput ตาม BR-01/02/14 DRAFT เก็บวันในอดีตได้ถ้า ordering ถูก แต่ publish ต้องก่อน closes_at; หลัง lock ตรวจ status ก่อน (ไม่ใช่ DRAFT=409 INVALID_TRANSITION) แล้วตรวจเวลา (ที่/หลัง deadline=409 DEADLINE_PASSED) Sprint 1 ไม่มี edit/delete endpoints

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-06 | Organizer สร้าง DRAFT ถูกต้อง owner ตรง session และอ่านกลับผ่าน own endpoint ได้ | TEST-07 |
| AC-07 | ผิด type/required fields/trimmed code-point lengths/capacity/timestamp ordering/offset/precision หรือ unknown fields ได้ 400 โดยไม่ insert | TEST-08 |
| AC-08 | เจ้าของ publish DRAFT ก่อน deadline ได้; status ไม่ใช่ DRAFT ได้ INVALID_TRANSITION ก่อนตรวจ deadline; DRAFT ที่/หลัง deadline ได้ DEADLINE_PASSED โดย status เดิม | TEST-09, TEST-10 |
| AC-09 | Shared list/detail แสดงเฉพาะ PUBLISHED/CLOSED; own list แสดงเฉพาะของตนรวม DRAFT; ไม่แสดง private roster | TEST-11 |
| AC-10 | Anonymous ทำ protected operations ไม่ได้; Participant สร้าง/publish/อ่าน owner routes ได้ 403; Organizer อื่นเข้าถึง owner record/publish ได้ 404; spoof owner/status fields ได้ 400 | TEST-12, TEST-13 |
| AC-11 | UI แสดง input validation/loading/empty/error; เวลาแสดง Bangkok และ deadline เป็นขอบเขตเดียวกับ backend | TEST-14, TEST-36 |

DoD: AC-06–11, validation/permission tests, migration/seed และ Product DoD

## F-03 — Atomic event registration

**Links:** FR-06, BR-03–07,10,14; NFR-01,03–04,06; dependency: F-01/F-02

### Workflow / UI

Participant เปิดรายละเอียด → กดลงทะเบียน → ส่ง event reference เท่านั้น → backend ตรวจ role, event, deadline, duplicate และ remaining capacity ใน transaction → แสดง registration reference และลิงก์รายการของตน

เมื่อเต็ม/หมดเวลา/ลงซ้ำ UI แสดงเหตุผลที่อ่านรู้เรื่องและดึงสถานะใหม่ กดซ้ำเร็วอาจสร้างหลาย request ได้ แต่ DB ต้องไม่สร้างซ้ำ หาก network timeout หลัง server commit ให้ผู้ใช้ตรวจรายการของตนก่อน retry การ retry ที่พบ ACTIVE เดิมตอบ duplicate โดยไม่เปลี่ยนข้อมูล

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| POST /api/events/{id}/registrations | EmptyInput + CSRF header; participant จาก session | 201 data: RegistrationCreated | 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN; 404 EVENT_NOT_FOUND (รวม DRAFT); 409 REGISTRATION_CLOSED / ALREADY_REGISTERED / EVENT_FULL; 400 unexpected fields |

ตรวจ DRAFT เป็น 404 เพื่อไม่เปิดเผยกิจกรรมที่ยังไม่เผยแพร่ CLOSED เป็น 409 เช่นเดียวกับเลย deadline Error code precedence หลังตรวจ event scope คือ event-open → duplicate → capacity ดังนั้น request เดียวอาจตรงหลายข้อแต่คืนเหตุผลแรกตามลำดับนี้

Data: Registration UNIQUE(event_id, participant_id); สร้าง ACTIVE เพียงรายการเดียวใน Sprint 1; count คำนวณจาก DB, lock Event ก่อนตรวจเงื่อนไขจน commit ตาม System SDS ห้ามให้ client กำหนด participant_id/status/registered_at

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-12 | Participant ลงทะเบียน PUBLISHED ก่อน deadline ที่มีที่ว่างได้ 201; identity มาจาก session; DB มี ACTIVE และอ่านกลับได้ | TEST-15 |
| AC-13 | PUBLISHED ก่อน deadline และมี ACTIVE ของตนแล้ว ได้ 409 ALREADY_REGISTERED แม้เต็มด้วย โดย record/count/registered_at เดิม | TEST-16 |
| AC-14 | PUBLISHED ก่อน deadline ที่เต็มและไม่มี ACTIVE ของตน ได้ 409 EVENT_FULL โดยไม่มี registration ใหม่ | TEST-17 |
| AC-15 | DRAFT=404 EVENT_NOT_FOUND; CLOSED/ที่หรือหลัง deadline=409 REGISTRATION_CLOSED ก่อนตรวจ duplicate/full; -1 ms เมื่อมีที่นั่งสำเร็จ; รอ lock จน deadline ต้องปฏิเสธ | TEST-18 |
| AC-16 | Anonymous/Organizer ถูกปฏิเสธ; spoof participant/status ถูก 400; ทุกกรณีไม่เปลี่ยน DB | TEST-19 |
| AC-17 | สอง Participant แย่งที่นั่งสุดท้าย สำเร็จ 1 ถูกปฏิเสธ 1 และ count ไม่เกิน capacity; คำขอพร้อมกันของคนเดียวสร้างได้รายการเดียว | TEST-20, TEST-21 |

DoD: AC-12–17, PostgreSQL concurrency, meaningful TDD และ Product DoD; rejected requests ไม่มี side effects

## F-04 — My registrations

**Links:** FR-07, BR-06, NFR-01,03,06; dependency: F-03

### Workflow / UI

Participant เปิด /my/registrations เห็นรายการล่าสุดของตน คลิกรายละเอียดและเปิดใหม่หลัง refresh/re-login ได้ Empty state ชี้กลับไปเลือกกิจกรรม; ไม่มี cancellation/check-in control ใน Sprint 1

### API / data contract

| Method / path | Success | Failure |
|---|---|---|
| GET /api/my/registrations | 200 data: MyRegistration[] ของตน เรียง registered_at DESC, id ASC | 401/403 |
| GET /api/my/registrations/{id} | 200 data: MyRegistration ของตน | 401/403; 404 REGISTRATION_NOT_FOUND รวมของคนอื่น |

Response ใช้ MyRegistration schema ข้างต้น โดย event เป็น EventSummary object; ไม่คืน password/session/ข้อมูล Participant อื่น ไม่มีการเปลี่ยน database schema ใน feature นี้ ใช้ Registration/Event จาก F-02/F-03; query ต้อง scope owner ตั้งแต่ต้น ไม่ใช้ client-supplied user ID

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-18 | List/detail ตรงข้อมูลที่ persist แล้วของตนและอ่านได้หลัง refresh/re-login | TEST-22, TEST-24 |
| AC-19 | ไม่เห็น record ของคนอื่นใน list และเข้าถึง detail ผ่าน direct ID ไม่ได้; anonymous 401, Organizer 403 | TEST-23 |
| AC-20 | ไม่มี registration แสดง empty state; failed fetch แสดง error/retry โดยไม่แสดงข้อมูลของ session ก่อน | TEST-25 |

DoD: AC-18–20, persisted retrieval/private-data tests และ Product DoD

## F-05 — Organizer roster

**Links:** FR-08 ส่วน roster, BR-07, NFR-01,03,06; dependency: F-02/F-03

### Workflow / UI

Organizer เปิดกิจกรรมของตน → ดู roster แสดง registration reference, participant display_name, status และ registered_at พร้อม ACTIVE count เรียง registered_at ASC, id ASC กรณีไม่มีผู้ลงทะเบียนแสดง count=0 และ empty state ไม่มี check-in control ใน Sprint 1

### API / data contract

| Method / path | Success | Failure |
|---|---|---|
| GET /api/organizer/events/{id}/registrations | 200 data: Roster ของกิจกรรมนี้ | 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN; 404 EVENT_NOT_FOUND เมื่ออยู่นอก ownership |

Data ไม่เปลี่ยน schema; owner filter บน Event ก่อน query registrations ไม่เปิดเผยข้อมูล authentication ของ Participant หรือรายชื่อข้ามกิจกรรม

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-21 | เจ้าของเห็น roster เฉพาะ event ที่ขอและ ACTIVE count ตรง DB; ไม่มีรายการแสดง empty/count=0 | TEST-26, TEST-28 |
| AC-22 | Organizer อื่นได้ 404; Participant ได้ 403; anonymous ได้ 401 และ response ไม่เปิดเผยรายชื่อ | TEST-27 |
| AC-23 | หลังมี registration ใหม่ reload แล้ว roster/count เปลี่ยนตรง DB โดยไม่มีข้อมูล private เกิน contract | TEST-29 |

DoD: AC-21–23, owner/role tests และ Product DoD

## Cross-feature acceptance สำหรับ Sprint 1

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-24 | Journey Organizer publish → Participant register/read → Organizer roster ทำได้ผ่าน UI จริง | TEST-30 |
| AC-25 | DB record และยอดคงเดิมหลัง restart แอป; ผู้ทดสอบติดตั้งจากเอกสารบน environment ใหม่แล้วทำ journey ได้ | TEST-31, TEST-35 |
| AC-26 | Errors รวม 500 ตรง schema/code และไม่แสดง secrets/SQL/traceback; UI อธิบาย rejection/role restrictions ได้ | TEST-32, TEST-33 |
| AC-27 | ทุก AC มี test/ผลจริง/commit; D1 มี review/integration/release และเปิดเผย failed/skipped/incomplete ตามจริง | TEST-34 |

ทั้ง F-01–05 ต้องผ่าน Product DoD และ cross-feature acceptance ที่เกี่ยวข้อง นอกจาก feature-local AC

## Revision history

ดู [Changelog](../../changelog.md) สำหรับ v0.1–0.5 และ commit ที่ตรวจได้ ก่อน implementation ให้ version contract/test design และบันทึก IDs/เหตุผลเมื่อแก้ Sprint 2 ต้อง revise F-03 เพื่อรองรับ CANCELLED→ACTIVE/history ภายใต้ lock เดิมพร้อม tests
