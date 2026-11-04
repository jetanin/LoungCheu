# Part E — Sprint 1 Feature Engineering Contracts

เอกสาร LC-S1-CONTRACT | Version 0.2 | 4 พฤศจิกายน 2026 | Draft before implementation; stack ตามผู้ใช้

ทุก feature ยัง PLANNED; ผู้เขียน/ผู้รีวิวจริงและ contract commit ยังไม่มี อ้าง SRS และ System SDS v0.2 Frontend เป็น React/TypeScript/Vite/Bootstrap, REST API ใช้ Express/TypeScript, data ใช้ PostgreSQL/Prisma และ tests ใช้ Vitest/Supertest กติกากลาง success/error/session/time ตาม System SDS; CSRF/role/ownership ต้องตรวจบน backend

AC IDs เป็น stable IDs ใช้ trace ไป STS; การเปลี่ยนสัญญาต้องลง changelog ก่อนเปลี่ยน implementation ไม่อ้างว่าทำ TDD แล้วจากการเขียน STS อย่างเดียว

## F-01 — Authentication, identity และ Logout

**Links:** FR-01–02, BR-06–07, NFR-01–02,06; dependency: PostgreSQL session store และ synthetic user seed

### Workflow / UI

ผู้ใช้เปิด /login → รับ CSRF token → กรอก username/password → backend ตรวจ active account → สร้าง session ใหม่และเปิดหน้า /events พร้อมชื่อ/role ผู้ใช้ มี Logout ใน navigation ทั้งสอง role หลัง Logout กลับ Login และ browser ไม่ควรแสดงข้อมูลส่วนตัวค้างใน protected screen

Form ไม่ trim/เปลี่ยน password ที่ผู้ใช้ส่ง ค่า username trim ตาม convention ของ seed; ปิดปุ่มระหว่างส่ง ข้อมูลผิดแสดงข้อความเดียวกันสำหรับ username ไม่พบ/password ผิด/inactive โดยไม่ยืนยันว่าบัญชีมีอยู่ Session หมดอายุให้ Login ใหม่ ไม่ใช้ client-selected role

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| GET /api/auth/csrf | ไม่มี body | 200 data: csrf_token สำหรับ Express CSRF middleware; bind กับ session | ไม่คืน session ID/password |
| POST /api/auth/login | username, password + CSRF | 200 data: id, display_name, role; Set-Cookie authenticated session ใหม่ | 400 required fields; 401 INVALID_CREDENTIALS; 403 CSRF_FAILED |
| GET /api/auth/me | Session cookie | 200 data: id, display_name, role | 401 AUTH_REQUIRED |
| POST /api/auth/logout | Session cookie + CSRF | 204, invalidate session และ clear cookie | 401 AUTH_REQUIRED; 403 CSRF_FAILED |

Data: Prisma User model + role/is_active และ PostgreSQL-backed Express session store เก็บ password เป็น scrypt hash พร้อม salt/parameters เท่านั้น ไม่เปลี่ยน domain entities ของ Event/Registration หลัง Login regenerate session และให้ React ขอ CSRF token ใหม่ก่อน mutation ถัดไป Protected endpoints ตรวจ user active ด้วย เพื่อไม่ให้ inactive account ใช้ session เก่าได้

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-01 | Active Participant และ Organizer Login ได้ role ถูกต้อง และ session identifier rotate เมื่อ Login | TEST-01 |
| AC-02 | Missing fields ตอบ 400; wrong password/unknown username/inactive ตอบ 401 โดยไม่สร้าง authenticated session และข้อความ credential failure ไม่แยกว่าบัญชีมีอยู่ | TEST-02 |
| AC-03 | /me คืนเฉพาะข้อมูลตัวเอง; ไม่มี session/session หมดอายุ/inactive ตอบ 401 และไม่คืน private data | TEST-03, TEST-06 |
| AC-04 | Logout สำเร็จแล้ว cookie/session เดิมเข้าถึง protected API ไม่ได้ | TEST-04 |
| AC-05 | เก็บ password เป็น salted scrypt hash ตาม design; cookie ตั้งค่าตาม design; mutation ที่ไม่มี/ผิด CSRF ถูกปฏิเสธ | TEST-05 |

DoD: AC-01–05 ผ่านจริง พร้อม auth test excerpts/config evidence, teammate review และ Product DoD ที่ใช้กับ D1 ไม่มี requirement สมัครบัญชี/กู้รหัสผ่านใน feature นี้

## F-02 — Event creation, publication และ browsing

**Links:** FR-03–05, FR-08 (own list), BR-01–02,07,09,11,14; NFR-01,03,06; dependency: F-01

### Workflow / UI

Organizer เปิดรายการของตน → Create → กรอก title/description/location/capacity/starts_at/ends_at/registration_closes_at → Save เป็น DRAFT → preview → Publish → event ปรากฏในรายการทั่วไป

Main list เรียง starts_at แล้ว id; own list เรียง created_at ล่าสุดแล้ว id รายละเอียดแสดงเวลา Asia/Bangkok และเงื่อนไขปิดรับ/ที่นั่งว่าง DRAFT มองเห็นได้ผ่าน owner routes เท่านั้น Public event API ในที่นี้หมายถึงรายการใช้ร่วมกันของผู้ Login ไม่ใช่ anonymous access

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| POST /api/organizer/events | title, description, location, capacity, starts_at, ends_at, registration_closes_at | 201 Event(status=DRAFT), owner จาก session | 400 INVALID_INPUT, 401/403 |
| GET /api/organizer/events | ไม่มี body | 200 events ของ Organizer ปัจจุบันรวม DRAFT | 401/403 |
| GET /api/organizer/events/{id} | ไม่มี body | 200 รายละเอียดเฉพาะเจ้าของ | 401/403/404 |
| POST /api/organizer/events/{id}/publish | empty body + CSRF | 200 Event(status=PUBLISHED) | 400 invalid event; 409 INVALID_TRANSITION / DEADLINE_PASSED; 401/403/404 |
| GET /api/events | ไม่มี body | 200 PUBLISHED/CLOSED events | 401 |
| GET /api/events/{id} | ไม่มี body | 200 event ที่ PUBLISHED/CLOSED | 401/404 รวม DRAFT |

Shared event response: id, title, description, location, capacity, starts_at, ends_at, registration_closes_at, status, active_count, available_seats, registration_open; ไม่คืน roster, emails, password หรือข้อมูลผู้เข้าร่วม ค่า available_seats = capacity-active_count และเป็นข้อมูล ณ เวลาอ่าน ต้องตรวจอีกครั้งเมื่อ register

Data: สร้าง Event schema/constraints/index และ FK owner ตาม System SDS; ไม่มี deletion/update endpoints ใน Sprint 1 Publish lock Event และเปลี่ยนสถานะใน transaction ตรวจเวลาปัจจุบันอีกครั้ง ค่าที่ผิด ordering ตอบ 400 ส่วนเวลาปิดรับผ่านไปแล้วขณะ publish ตอบ 409

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-06 | Organizer สร้าง DRAFT ถูกต้อง owner ตรง session และอ่านกลับผ่าน own endpoint ได้ | TEST-07 |
| AC-07 | capacity/required fields/field lengths/timestamp ordering/offset ไม่ถูกต้องถูกปฏิเสธ และไม่สร้าง record | TEST-08 |
| AC-08 | เจ้าของ publish DRAFT ก่อน deadline ได้; publish ซ้ำ/CLOSED/เลย deadline ถูกปฏิเสธโดยไม่มี transition เพิ่ม | TEST-09, TEST-10 |
| AC-09 | Shared list/detail แสดงเฉพาะ PUBLISHED/CLOSED; own list แสดงเฉพาะของตนรวม DRAFT; ไม่แสดง private roster | TEST-11 |
| AC-10 | Anonymous ทำ protected operations ไม่ได้; Participant สร้าง/publish/อ่าน owner routes ได้ 403; Organizer อื่นเข้าถึง owner record/publish ได้ 404; spoof owner/status fields ได้ 400 | TEST-12, TEST-13 |
| AC-11 | UI แสดง input validation/loading/empty/error; เวลาแสดง Bangkok และ deadline เป็นขอบเขตเดียวกับ backend | TEST-14, TEST-36 |

DoD: AC-06–11 และ validation/permission tests ผ่านจริง; migration/seed/reproduction ใช้ได้; owner บันทึกจาก session และไม่มีข้อมูล private ใน shared response

## F-03 — Atomic event registration

**Links:** FR-06, BR-03–07,10,14; NFR-01,03–04,06; dependency: F-01/F-02

### Workflow / UI

Participant เปิดรายละเอียด → กดลงทะเบียน → ส่ง event reference เท่านั้น → backend ตรวจ role, event, deadline, duplicate และ remaining capacity ใน transaction → แสดง registration reference และลิงก์รายการของตน

เมื่อเต็ม/หมดเวลา/ลงซ้ำ UI แสดงเหตุผลที่อ่านรู้เรื่องและดึงสถานะใหม่ กดซ้ำเร็วอาจสร้างหลาย request ได้ แต่ DB ต้องไม่สร้างซ้ำ หาก network timeout หลัง server commit ให้ผู้ใช้ตรวจรายการของตนก่อน retry การ retry ที่พบ ACTIVE เดิมตอบ duplicate โดยไม่เปลี่ยนข้อมูล

### API / data contract

| Method / path | Request | Success | Failure |
|---|---|---|---|
| POST /api/events/{id}/registrations | empty JSON + CSRF; participant จาก session | 201 data: id, event_id, status=ACTIVE, registered_at | 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN; 404 EVENT_NOT_FOUND (รวม DRAFT); 409 REGISTRATION_CLOSED / ALREADY_REGISTERED / EVENT_FULL; 400 unexpected fields |

ตรวจ DRAFT เป็น 404 เพื่อไม่เปิดเผยกิจกรรมที่ยังไม่เผยแพร่ CLOSED เป็น 409 เช่นเดียวกับเลย deadline Error code precedence หลังตรวจ event scope คือ event-open → duplicate → capacity ดังนั้น request เดียวอาจตรงหลายข้อแต่คืนเหตุผลแรกตามลำดับนี้

Data: Registration UNIQUE(event_id, participant_id); สร้าง ACTIVE เพียงรายการเดียวใน Sprint 1; count คำนวณจาก DB, lock Event ก่อนตรวจเงื่อนไขจน commit ตาม System SDS ห้ามให้ client กำหนด participant_id/status/registered_at

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-12 | Participant ลงทะเบียน PUBLISHED ก่อน deadline ที่มีที่ว่างได้ 201; identity มาจาก session; DB มี ACTIVE และอ่านกลับได้ | TEST-15 |
| AC-13 | ลงซ้ำได้ 409 ALREADY_REGISTERED โดย count/record ไม่เพิ่ม | TEST-16 |
| AC-14 | event เต็มได้ 409 EVENT_FULL โดยไม่มี registration ใหม่ | TEST-17 |
| AC-15 | DRAFT ได้ 404; CLOSED/ที่ deadline/หลัง deadline ได้ 409; ก่อน deadline เมื่อมีที่นั่งยังสำเร็จ | TEST-18 |
| AC-16 | Anonymous/Organizer ถูกปฏิเสธ; spoof participant/status ถูก 400; ทุกกรณีไม่เปลี่ยน DB | TEST-19 |
| AC-17 | สอง Participant แย่งที่นั่งสุดท้าย สำเร็จ 1 ถูกปฏิเสธ 1 และ count ไม่เกิน capacity; คำขอพร้อมกันของคนเดียวสร้างได้รายการเดียว | TEST-20, TEST-21 |

DoD: AC-12–17 พร้อม PostgreSQL concurrency evidence และ meaningful TDD; ทุก failure ตรวจ absence of side effects ไม่ถือว่า UI disabled button เป็นหลักฐาน duplicate prevention

## F-04 — My registrations

**Links:** FR-07, BR-06, NFR-01,03,06; dependency: F-03

### Workflow / UI

Participant เปิด /my/registrations เห็นรายการล่าสุดของตน คลิกรายละเอียดและเปิดใหม่หลัง refresh/re-login ได้ Empty state ชี้กลับไปเลือกกิจกรรม; ไม่มี cancellation/check-in control ใน Sprint 1

### API / data contract

| Method / path | Success | Failure |
|---|---|---|
| GET /api/my/registrations | 200 data array ของ session user เรียง registered_at ล่าสุดแล้ว id | 401/403 |
| GET /api/my/registrations/{id} | 200 record ของ session user | 401/403/404 รวมของคนอื่น |

Response มี id, status, registered_at และ event summary ที่ใช้แสดงชื่อ/เวลา/สถานที่ ไม่คืน password/session/ข้อมูล Participant อื่น ไม่มีการเปลี่ยน schema ใน feature นี้ ใช้ Registration/Event จาก F-02/F-03; query ต้อง scope owner ตั้งแต่ต้น ไม่ใช้ client-supplied user ID

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-18 | List/detail ตรงข้อมูลที่ persist แล้วของตนและอ่านได้หลัง refresh/re-login | TEST-22, TEST-24 |
| AC-19 | ไม่เห็น record ของคนอื่นใน list และเข้าถึง detail ผ่าน direct ID ไม่ได้; anonymous 401, Organizer 403 | TEST-23 |
| AC-20 | ไม่มี registration แสดง empty state; failed fetch แสดง error/retry โดยไม่แสดงข้อมูลของ session ก่อน | TEST-25 |

DoD: AC-18–20 และ API integration/private data checks ผ่านจริง; ต้องมี retrieval จาก server/DB ไม่ใช่ใช้ browser state เดิม

## F-05 — Organizer roster

**Links:** FR-08 ส่วน roster, BR-07, NFR-01,03,06; dependency: F-02/F-03

### Workflow / UI

Organizer เปิดกิจกรรมของตน → ดู roster แสดง registration reference, participant display_name, status และ registered_at พร้อม ACTIVE count เรียง registered_at เก่าไปใหม่แล้ว id กรณีไม่มีผู้ลงทะเบียนแสดง count=0 และ empty state ไม่มี check-in control ใน Sprint 1

### API / data contract

| Method / path | Success | Failure |
|---|---|---|
| GET /api/organizer/events/{id}/registrations | 200 data: event_id, capacity, active_count, registrations array ของกิจกรรมนี้ | 401 AUTH_REQUIRED; 403 ROLE_FORBIDDEN; 404 EVENT_NOT_FOUND เมื่ออยู่นอก ownership |

Data ไม่เปลี่ยน schema; owner filter บน Event ก่อน query registrations ไม่เปิดเผยข้อมูล authentication ของ Participant หรือรายชื่อข้ามกิจกรรม

### Acceptance Criteria

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-21 | เจ้าของเห็น roster เฉพาะ event ที่ขอและ ACTIVE count ตรง DB; ไม่มีรายการแสดง empty/count=0 | TEST-26, TEST-28 |
| AC-22 | Organizer อื่นได้ 404; Participant ได้ 403; anonymous ได้ 401 และ response ไม่เปิดเผยรายชื่อ | TEST-27 |
| AC-23 | หลังมี registration ใหม่ reload แล้ว roster/count เปลี่ยนตรง DB โดยไม่มีข้อมูล private เกิน contract | TEST-29 |

DoD: AC-21–23 ผ่านจริงพร้อม owner/role negative tests และ demonstration ต่อเนื่องจาก participant journey

## Cross-feature acceptance สำหรับ Sprint 1

| AC | ผลที่ต้องสังเกตได้ | Planned tests |
|---|---|---|
| AC-24 | Journey Organizer publish → Participant register/read → Organizer roster ทำได้ผ่าน UI จริง | TEST-30 |
| AC-25 | DB record และยอดคงเดิมหลัง restart แอป; ผู้ทดสอบติดตั้งจากเอกสารบน environment ใหม่แล้วทำ journey ได้ | TEST-31, TEST-35 |
| AC-26 | Error bodies ของ auth/validation/permission/conflict ไม่แสดง secrets/SQL/traceback; UI อธิบาย business rejection และ role restrictions ได้ | TEST-32, TEST-33 |
| AC-27 | ทุก AC มี test/ผลจริง/commit; D1 มี review/integration/release และเปิดเผย failed/skipped/incomplete ตามจริง | TEST-34 |

ทั้ง F-01–05 ต้องผ่าน Product DoD และ cross-feature acceptance ที่เกี่ยวข้อง นอกจาก feature-local AC

## Change protocol และประวัติ

| Version | เปลี่ยนแปลง | Contract commit | Reviewer |
|---|---|---|---|
| 0.1 | Initial proposed contracts F-01–05 และ cross-feature AC | ยังไม่ได้ commit | ยังไม่ได้ review |
| 0.2 | เปลี่ยน technical design เป็น React/Express/TypeScript/Prisma ตามผู้ใช้; คง stable business AC IDs และปรับ password/session/CSRF details | ยังไม่ได้ commit | ยังไม่ได้ teammate review |

Sprint 2 ต้อง revise F-03 เพื่อรองรับ CANCELLED→ACTIVE ภายใต้ lock เดิม และเพิ่ม history พร้อม test ก่อน implement ไม่เปลี่ยน contract ย้อนหลังให้ดูเหมือน Sprint 1 ทำความสามารถนี้แล้ว
