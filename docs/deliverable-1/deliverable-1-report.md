# CPE 334 Project Deliverable 1: Engineering Baseline and Working Sprint 1

**Semester 1/2026 | Department of Computer Engineering, KMUTT**

---

## Submission Metadata & Navigation

### Team Information
* **Theme / Project Name:** LoungCheu (ระบบบริหารจัดการและลงทะเบียนกิจกรรมชุมชนแบบอะตอมมิก)
* **Repository URL:** https://github.com/jetanin/LoungCheu
* **Submitted main release:** ยังไม่มีหลักฐาน accepted main release/tag; `v1.0.0-sprint-1` เป็น target เท่านั้น. Staging merge candidate: `97a5b91`; recorded automated tested source: `3313288`.
* **Members:**
  1. นายเจตนินทร์ นายโท (Jetanin Naitho) — รหัสนักศึกษา 67070501011 (GitHub: `@jetanin`)
  2. นายปภังกร ล่วนเส้ง (Paphangkorn Luanseng) — รหัสนักศึกษา 67070501083 (GitHub: `i3artuf`)

---

### Navigation Table (ตารางนำทางโครงสร้างรายงาน Parts A–F)

| Part | Section | Description / Key Artifacts | Identifiers (IDs) |
|:---:|:---|:---|:---|
| **A** | **Software Requirements Specification (SRS)** | Stakeholders, User Context, Scopes/Exclusions, FRs, BRs, NFRs, Architectural Decisions | FR-01–15, BR-01–14, NFR-01–09, DEC-01–17 |
| **B** | **Feature Inventory & Traceability** | Feature Mapping to Requirements, Planned Sprints, Traceability Matrix, Coverage Analysis | F-01–09, SYS-AUTH, SYS-DATA, SYS-UX, SYS-DELIVERY, SYS-QA, AC-01–27 |
| **C** | **System-Level Software Design Specification (SDS)** | Architecture Stack, ERD/Data Models, API Error Protocols, RBAC Permission Matrix, Deployment Plan | Components (UI/API/DB), Models, Endpoints |
| **D** | **Three-Sprint Plan** | Sprint 1–3 Goals, Feature Scope Allocations, Dependencies, Delivery Checkpoints | Sprints 1, 2, 3 |
| **E** | **Sprint 1 Engineering Contracts & STS** | Feature Design Contracts, Detailed ACs, Software Test Specification (STS), Product Definition of Done | AC-01–27, TEST-01–36, DOD-01–10 |
| **F** | **Working Sprint 1 & Verification Evidence** | Program Demonstrations (Screenshots), Automated Test Results, Test Excerpts (TDD), Git Workflow Chains, Contributions | EV-01–12, PR #7, PR #10, Commit 97a5b91 |

---

## Part A: SRS and Product Scope

### 1. Stakeholder Problem & Context
* **Problem Statement:** การจัดกิจกรรมสัมมนา เวิร์กช็อป หรือกิจกรรมชุมชน มักประสบปัญหาเรื่องการลงทะเบียนเกินจำนวน (Overbooking), การแย่งชิงที่นั่งพร้อมกัน (Concurrency Race Conditions), และความไม่ปลอดภัยของข้อมูลผู้เข้าร่วมงาน
* **Target Users (Actors):**
  1. **Organizer (OA / OB):** ผู้จัดกิจกรรม มีหน้าที่สร้าง แก้ไข กำหนดเวลา และเผยแพร่กิจกรรม ตลอดจนตรวจสอบรายชื่อผู้ลงทะเบียน (Roster) ของตนเอง
  2. **Participant (PA / PB):** สมาชิกผู้เข้าร่วม มีหน้าที่ค้นหาและดูรายละเอียดกิจกรรม ลงทะเบียนเข้าร่วม และตรวจสอบรายการที่ตนเองลงทะเบียนไว้
  3. **Anonymous User:** เข้า Login/CSRF bootstrap ได้; shared event list/detail และ domain endpoints ต้องมี session มิฉะนั้นตอบ401 AUTH_REQUIRED ตาม baseline/implementation

### 2. Functional Requirements and Business Rules — baseline IDs

คัดตารางจาก [SRS](../srs.md); ไม่กำหนดความหมายของ FR/BR/NFR ใหม่. Sprint2/3 เป็น planned scope ยังไม่อ้าง implementation.

| ID | ข้อกำหนดที่สังเกตผลได้ | Sprint |
|---|---|---:|
| FR-01 | ผู้ใช้ที่ active Login ด้วย username/password ได้ และข้อมูลผิดต้องไม่สร้าง authenticated session | 1 |
| FR-02 | ผู้ใช้เรียกดู identity/role ของตนและ Logout เพื่อยกเลิก session ปัจจุบันได้ | 1 |
| FR-03 | Organizer สร้างกิจกรรม DRAFT พร้อมรายละเอียด เวลา วันปิดรับ และความจุได้ | 1 |
| FR-04 | Organizer เผยแพร่ DRAFT ของตนที่ผ่าน validation ได้ | 1 |
| FR-05 | ผู้ใช้ที่ Login ดูรายการและรายละเอียดกิจกรรม PUBLISHED/CLOSED ได้ โดยไม่เปิดเผยรายชื่อผู้ลงทะเบียน | 1 |
| FR-06 | Participant ลงทะเบียนกิจกรรมที่เปิดรับได้ และได้รับเลขอ้างอิงที่บันทึกในฐานข้อมูล | 1 |
| FR-07 | Participant ดูรายการ/รายละเอียดการลงทะเบียนของตน พร้อมสถานะและกิจกรรมที่เกี่ยวข้องได้ | 1 |
| FR-08 | Organizer ดูรายการกิจกรรมของตนและรายชื่อผู้ลงทะเบียนพร้อมยอด ACTIVE ของกิจกรรมนั้นได้ | 1 |
| FR-09 | Participant ยกเลิก ACTIVE ของตนก่อนปิดรับได้ และที่นั่งกลับมาใช้ได้ | 2 |
| FR-10 | Organizer ปิดรับกิจกรรม PUBLISHED ของตนได้โดยไม่ลบรายการลงทะเบียนเดิม | 2 |
| FR-11 | Organizer แก้ DRAFT ของตนได้ทุกช่องใน EventInput (ไม่รวม id/owner/status/system fields) และแก้ชื่อ คำอธิบาย สถานที่ หรือความจุของ PUBLISHED ได้ตามกฎ | 2 |
| FR-12 | Participant ที่เคยยกเลิกลงทะเบียนใหม่ได้เมื่อกิจกรรมยังเปิดรับและมีที่นั่ง | 2 |
| FR-13 | Organizer เช็กชื่อผู้มี ACTIVE registration ในกิจกรรมของตนภายในช่วงกิจกรรมได้ | 3 |
| FR-14 | Participant ดูสถานะการเช็กชื่อของตนได้ | 3 |
| FR-15 | Organizer ดูยอด ACTIVE, CANCELLED, checked-in และอัตราเข้าร่วมของกิจกรรมตนได้ | 3 |

#### Business Rules

| ID | กฎและผลเมื่อไม่ผ่าน |
|---|---|
| BR-01 | capacity เป็น JSON integer 1–1,000 ไม่ coercion string/boolean; title 1–120, description 1–2,000, location 1–200 Unicode code points หลัง trim; ทุกช่องต้องเป็น string และว่างไม่ได้ |
| BR-02 | `registration_closes_at <= starts_at < ends_at`; เผยแพร่ได้เมื่อ closes_at อยู่ในอนาคตเทียบเวลา server |
| BR-03 | ลงทะเบียนได้เมื่อ status=PUBLISHED และ `server_now < registration_closes_at`; ที่เท่ากับ deadline ต้องปฏิเสธ |
| BR-04 | หนึ่ง registration record ต่อ user/event; S2 reactivate record เดิมโดยคง registered_at ครั้งแรก ล้าง cancelled_at และ append history; ไม่สร้าง ACTIVE ซ้ำ |
| BR-05 | ACTIVE count ต้องไม่เกิน capacity แม้คำขอเข้าพร้อมกัน; คำขอที่แพ้ต้องไม่เพิ่ม record/กินที่นั่ง |
| BR-06 | Participant เข้าถึงและเปลี่ยนเฉพาะ registration ของตน และไม่มีสิทธิ์จัดการกิจกรรม/รายชื่อ |
| BR-07 | Organizer จัดการกิจกรรม รายชื่อ เช็กชื่อ และรายงานเฉพาะกิจกรรมตน; ไม่มีสิทธิ์ใช้ฟังก์ชันลงทะเบียนของ Participant |
| BR-08 | Participant ยกเลิกได้เฉพาะ ACTIVE ก่อน deadline และเมื่อ event=PUBLISHED; เรียกซ้ำกับ CANCELLED ต้องปฏิเสธโดยไม่มีผลข้างเคียง |
| BR-09 | Event transition คือ DRAFT→PUBLISHED→CLOSED; CLOSED ห้ามแก้ Event fields/เปิดกลับ แต่ check-in บน Registration ทำได้ตาม BR-12 |
| BR-10 | ลด capacity ไม่ต่ำกว่า ACTIVE count; ลงทะเบียน/ยกเลิก/ปรับความจุ/ปิดรับต้องประสาน transaction บน event เดียวกัน |
| BR-11 | owner immutable ทุกสถานะและกำหนดจาก session; PUBLISHED แก้เวลา/วันปิดรับไม่ได้; id/status/system fields ไม่รับผ่าน edit input และไม่มี hard delete ผ่านผลิตภัณฑ์ |
| BR-12 | Check-in ได้เฉพาะ ACTIVE และ `starts_at <= server_now <= ends_at`; CLOSED ยังเช็กชื่อได้ภายในช่วงงาน; เช็กชื่อซ้ำปฏิเสธ 409 ALREADY_CHECKED_IN โดยไม่เปลี่ยน checked_in_at/checked_in_by_id หรือยอดเข้าร่วม |
| BR-13 | ACTIVE/CANCELLED นับ record ตามสถานะปัจจุบันของ event; checked-in นับ ACTIVE ที่ checked_in_at ไม่เป็น null; reactivate ย้ายยอด CANCELLED ไป ACTIVE ไม่สะสมจำนวนครั้ง cancel ใน summary; อัตราเข้าร่วม = checked-in / ACTIVE × 100 ปัดทศนิยม 2 ตำแหน่ง ถ้า ACTIVE=0 แสดง 0.00%; lifecycle history แยกจากยอดปัจจุบัน |
| BR-14 | ทุกเวลาเก็บ UTC ความละเอียด millisecond; API รับ ISO 8601 ที่มี offset และเศษวินาที 0–3 หลัก คืน UTC แบบ YYYY-MM-DDTHH:mm:ss.SSSZ; input ละเอียดกว่า 3 หลักปฏิเสธ 400 ไม่ปัดเงียบ ๆ; UI Asia/Bangkok ระบุเขตเวลา; ใช้ server clock และตรวจเวลาของ event/registration mutations ภายใน transaction หลังได้ Event lock |

### 3. Non-Functional Requirements

| ID | เป้าหมายที่วัดได้ | วิธีตรวจ / Sprint |
|---|---|---|
| NFR-01 | API protected ต้องปฏิเสธทุกกรณีไม่มี session, role ผิด และ ownership ผิดใน access matrix โดยไม่ส่งข้อมูลที่ป้องกัน | Automated API integration tests / 1 และ regression ทุก Sprint |
| NFR-02 | หลัง Logout session เดิมใช้ endpoint protected ไม่ได้; session หมดอายุภายใน 2 ชั่วโมงนับจาก Login; ไม่เก็บรหัสผ่าน plaintext; production cookie เป็น HttpOnly/Secure/SameSite=Lax | Session/expiry/hash tests และ config check / 1; HTTPS deployment check / Lab 5 |
| NFR-03 | Demo registration ยังอ่านได้และ active count ไม่เปลี่ยนหลัง restart แอป; เมื่อ deploy ต้องอยู่หลัง restart/redeploy ด้วย | Real PostgreSQL integration และ manual restart test / 1; deployment persistence / Lab 5 |
| NFR-04 | คำขอผู้ใช้ต่างกัน 2 คำขอพร้อมกันแย่งที่นั่งสุดท้าย ต้องสำเร็จ 1 และถูกปฏิเสธ 1; duplicate concurrent request ของผู้ใช้เดียวกันสร้าง record เดียว | Separate connections/transactions บน PostgreSQL จริง / 1 |
| NFR-05 | จากฐานข้อมูล demo ใหม่ อีกคนติดตั้งตาม README/migration/seed และทำ critical journey ได้ครบ โดยไม่ต้องแก้ source | Reproduction checklist / 1; Docker fresh build / Lab 5 |
| NFR-06 | Error API ต้องมี code/message ที่คงรูปแบบและไม่แสดง traceback, password, session ID หรือ SQL; UI แสดง loading/empty/validation/error ตามที่ออกแบบ | Negative API tests และ UI checklist / 1 |
| NFR-07 | Relevant PRs มี build/test required checks และ failed check ไม่เข้าสู่เส้นทาง release ปกติ; deploy version ตรง main release | CI gate demonstration + deployed version check / Lab 5 และคงไว้ |
| NFR-08 | ทุก Sprint 1 AC มี planned test และตอนส่งมี actual test/manual record ที่ระบุผลกับ commit; requirement คงเหลือมี Sprint รับผิดชอบ | Traceability review / 1; ปรับทุก checkpoint |
| NFR-09 | ผู้ทดสอบภายนอกทีมทำ UAT อย่างน้อย 4 กรณี (normal/rule/access/persistence) พร้อม tester/version และ re-test accepted defect อย่างน้อย 1 รายการตาม Lab 6 | Independent UAT records / Lab 6; final re-test ตามผลกระทบ |

---

## Part B: Feature Inventory and Traceability

### 1. Feature Baseline Inventory

| ID | Feature / ผลลัพธ์ | Requirement / Rules | Dependency | Sprint |
|---|---|---|---|---:|
| F-01 | Login, identity และ Logout สำหรับ demo users | FR-01–02; BR-06–07; NFR-01–02 | Seed users, session store | 1 |
| F-02 | สร้าง/เผยแพร่กิจกรรม ดูกิจกรรมที่เผยแพร่ และรายการกิจกรรมของผู้จัด | FR-03–05, FR-08 ส่วนรายการกิจกรรม; BR-01–02,07,09,11,14 | F-01 | 1 |
| F-03 | ลงทะเบียนโดยคุม duplicate, deadline และ capacity | FR-06; BR-03–07,10,14; NFR-04 | F-01, F-02 | 1 |
| F-04 | ดูรายการและรายละเอียด registration ของตน; เพิ่มสถานะ check-in ผ่าน F-08 ใน S3 | FR-07; BR-06 | F-03 | 1 |
| F-05 | ดู roster และ ACTIVE count ของกิจกรรมตน | FR-08 ส่วน roster; BR-07 | F-02, F-03 | 1 |
| F-06 | ยกเลิก ลงทะเบียนใหม่ และปิดรับกิจกรรม | FR-09–10,12; BR-03–11,14 | F-03–05 | 2 |
| F-07 | แก้รายละเอียดและปรับความจุแบบไม่ทำให้ข้อมูลผิดกฎ | FR-11; BR-01–02,07,10–11,14 | F-02, F-03 | 2 |
| F-08 | เช็กชื่อและเพิ่ม own attendance status ใน F-04 | FR-13–14; BR-06–07,12,14 | F-04–06, F-07 (เวลา/สถานะกิจกรรม) | 3 |
| F-09 | สรุปการลงทะเบียน ยกเลิก และอัตราเข้าร่วม | FR-15; BR-07,13 | F-05, F-06, F-08 | 3 |

### 2. System Responsibilities and Traceability

| ID | ความรับผิดชอบร่วม | Owner feature / ตรวจ |
|---|---|---|
| SYS-AUTH | Authentication, role, record ownership, cookie, CSRF และ password policy | F-01 วางพื้นฐาน; ทุก feature ต้องตรวจ endpoint ของตน |
| SYS-DATA | Database constraints, migration, transaction, UTC และ seed | F-01 วาง User/session migration/seed; F-02/F-03 วาง domain/transaction foundation; F-06/F-07/F-08 รักษากฎร่วม |
| SYS-UX | Error contract, validation, loading และ empty state | F-01–05 เริ่ม; ทุก feature รักษา convention |
| SYS-DELIVERY | Reproduction, Docker, CI gate, GCP และ version identification | Sprint 1 ออกแบบ/ local setup; Lab 5 ทำจริง; ทุก release หลังจากนั้น |
| SYS-QA | AC→test traceability, regression และ independent UAT | ทุก Sprint; Lab 6 ทำ UAT; Lab 7 ทำ maintenance |

| Feature | AC | Planned tests |
|---|---|---|
| F-01 | AC-01–05 | TEST-01–06 |
| F-02 | AC-06–11 | TEST-07–14, TEST-36 |
| F-03 | AC-12–17 | TEST-15–21 |
| F-04 | AC-18–20 | TEST-22–25 |
| F-05 | AC-21–23 | TEST-26–29 |
| Cross-feature / SYS-QA | AC-24–27 | TEST-30–35 |

ตาราง requirement allocation และ actual file/name/result/tested commit ฉบับเต็มอยู่ใน [Traceability](../traceability.md). AC-25/26/27 ยัง PARTIAL; feature review/staging merge ไม่ใช่ main release/independent acceptance.

---

## Part C: System-Level SDS

### 1. System Architecture & Tech Stack
* **Client Architecture:** React 19.3.1 SPA + TypeScript + Vite + Bootstrap 5.3.8 และ shared CSS ตาม client/package.json
* **Application / Server Layer:** Node.js v22 พร้อม Express framework ในรูปแบบ Modular Architecture แยกตาม Business Domains
* **Database & ORM:** PostgreSQL 17 จัดการโครงสร้างข้อมูลและการทำ Migration ด้วย Prisma ORM
* **Testing Frameworks:** Vitest สำหรับ Unit และ Integration Testing, Supertest สำหรับ API Testing, Playwright สำหรับ Browser E2E Testing

### 2. Domain Data Model & Relational Schema

| Prisma model / SQL table | Implemented Prisma fields | Status/constraints |
|---|---|---|
| User / users | id, username, passwordHash, displayName, role, isActive | username unique; Role ORGANIZER/PARTICIPANT; ไม่คืน passwordHash ผ่าน API |
| Event / events | id, organizerId, title, description, location, startsAt, endsAt, registrationClosesAt, capacity, status, createdAt, updatedAt | EventStatus DRAFT/PUBLISHED/CLOSED; organizer FK User |
| Registration / registrations | id, eventId, participantId, status, registeredAt | RegistrationStatus ACTIVE/CANCELLED; UNIQUE(eventId, participantId); FK Event/User |

ชื่อ SQL/API ใช้ snake_case เช่น display_name/is_active/organizer_id/starts_at/registration_closes_at/participant_id/registered_at ผ่าน Prisma @map; User ไม่มี createdAt/updatedAt ใน schema ปัจจุบัน. CANCELLED enum เตรียมไว้ แต่ Sprint1 ไม่มี cancellation mutation; history/check-in fields เป็น design S2/S3. รายละเอียด mapping/relations และ planned extensions อยู่ใน [System SDS](../system-sds.md).

### 3. API Conventions & Access Security

Success ใช้ `{data: ...}`; errors ใช้ `{error:{code,message,fields:{}}}` (field validation maps ไป string arrays). Session cookie เป็น HttpOnly/SameSite=Lax; Secure เมื่อ HTTPS. Mutations ตรวจ CSRF/Origin เพิ่มเติม. Client ไม่กำหนด identity/ownership แทน server.

| HTTP | Implemented endpoint | Access |
|---|---|---|
| GET | /api/health; /api/auth/csrf | Health / CSRF bootstrap |
| POST | /api/auth/login | Login พร้อม pre-auth CSRF |
| GET / POST | /api/auth/me (GET); /api/auth/logout (POST) | Authenticated own session; Logout มี CSRF |
| GET | /api/events; /api/events/:id | Authenticated users; PUBLISHED/CLOSED |
| GET / POST | /api/organizer/events | Organizer own list (GET) / create (POST) |
| GET / POST | /api/organizer/events/:id (GET); /api/organizer/events/:id/publish (POST) | Owner Organizer; other owner404 |
| POST | /api/events/:id/registrations | Participant; identity จาก session |
| GET | /api/my/registrations; /api/my/registrations/:id | Participant own scope; foreign reference404 |
| GET | /api/organizer/events/:id/registrations | Owner Organizer; other owner404, Participant403 |

อ้าง source: server/src/app.ts และ modules/events/router.ts, modules/registrations/{router,read-router}.ts. Planned cancel/reactivate/close/edit/check-in/summary routes ไม่ใช่ implemented Sprint1 endpoints.

---

## Part D: Three-Sprint Plan

| Sprint | Goal & Core Outcomes | Included Features | Deliverable & Target Date |
|:---:|:---|:---|:---|
| **Sprint 1** | **Engineering Baseline & Core Transaction Slice:** วางระบบยืนยันตัวตน, สถาปัตยกรรมหลัก, ระบบสร้าง/เผยแพร่ Event และ Atomic Registration Transaction ที่ป้องกัน Overbooking พร้อม E2E Tests | F-01, F-02, F-03, F-04, F-05 | Deliverable 1 (8 พ.ย. 2026) |
| **Sprint 2** | **Lifecycle Expansion & Capacity Management:** ระบบยกเลิกการลงทะเบียนพร้อมคืนโควต้า, การแก้ไขรายละเอียดและจำนวนที่นั่งของกิจกรรม, และปิดรับกิจกรรมตาม baseline | F-06, F-07 | Deliverable 2 (29 พ.ย. 2026) |
| **Sprint 3** | **Hardening, Analytics & On-site Attendance:** ระบบ Check-in ของ ACTIVE registration ในช่วงเวลากิจกรรม, รายงานสถิติผู้เข้าร่วมสำหรับ Organizer, และการ Hardening ระบบรองรับการ Deploy บน GCP | F-08, F-09 | Final Submission (13 ธ.ค. 2026) |

---

## Part E: Sprint 1 Engineering Contracts

### 1. Acceptance Criteria — copied from Sprint1 contracts

| AC | Baseline acceptance criterion | Planned test |
|---|---|---|
| AC-01 | Active Participant และ Organizer Login ได้ role ถูกต้อง และ session identifier rotate เมื่อ Login | TEST-01 |
| AC-02 | Missing/empty/wrong-type fields ตอบ 400; wrong password/unknown username/inactive ตอบ 401 โดยไม่สร้าง authenticated session และใช้ generic credential message | TEST-02 |
| AC-03 | /me คืนเฉพาะข้อมูลตัวเอง; ไม่มี session/session หมดอายุ/inactive ตอบ 401 และไม่คืน private data | TEST-03, TEST-06 |
| AC-04 | Logout สำเร็จแล้ว cookie/session เดิมเข้าถึง protected API ไม่ได้ | TEST-04 |
| AC-05 | Salted scrypt hash/cookie ตาม design; Login และ authorized mutation ที่ไม่มี/ผิด CSRF หรือ Origin ผิดถูกปฏิเสธโดยไม่เปลี่ยน domain data | TEST-05 |
| AC-06 | Organizer สร้าง DRAFT ถูกต้อง owner ตรง session และอ่านกลับผ่าน own endpoint ได้ | TEST-07 |
| AC-07 | ผิด type/required fields/trimmed code-point lengths/capacity/timestamp ordering/offset/precision หรือ unknown fields ได้ 400 โดยไม่ insert | TEST-08 |
| AC-08 | เจ้าของ publish DRAFT ก่อน deadline ได้; status ไม่ใช่ DRAFT ได้ INVALID_TRANSITION ก่อนตรวจ deadline; DRAFT ที่/หลัง deadline ได้ DEADLINE_PASSED โดย status เดิม | TEST-09, TEST-10 |
| AC-09 | Shared list/detail แสดงเฉพาะ PUBLISHED/CLOSED; own list แสดงเฉพาะของตนรวม DRAFT; ไม่แสดง private roster | TEST-11 |
| AC-10 | Anonymous ทำ protected operations ไม่ได้; Participant สร้าง/publish/อ่าน owner routes ได้ 403; Organizer อื่นเข้าถึง owner record/publish ได้ 404; spoof owner/status fields ได้ 400 | TEST-12, TEST-13 |
| AC-11 | UI แสดง input validation/loading/empty/error; เวลาแสดง Bangkok และ deadline เป็นขอบเขตเดียวกับ backend | TEST-14, TEST-36 |
| AC-12 | Participant ลงทะเบียน PUBLISHED ก่อน deadline ที่มีที่ว่างได้ 201; identity มาจาก session; DB มี ACTIVE และอ่านกลับได้ | TEST-15 |
| AC-13 | PUBLISHED ก่อน deadline และมี ACTIVE ของตนแล้ว ได้ 409 ALREADY_REGISTERED แม้เต็มด้วย โดย record/count/registered_at เดิม | TEST-16 |
| AC-14 | PUBLISHED ก่อน deadline ที่เต็มและไม่มี ACTIVE ของตน ได้ 409 EVENT_FULL โดยไม่มี registration ใหม่ | TEST-17 |
| AC-15 | DRAFT=404 EVENT_NOT_FOUND; CLOSED/ที่หรือหลัง deadline=409 REGISTRATION_CLOSED ก่อนตรวจ duplicate/full; -1 ms เมื่อมีที่นั่งสำเร็จ; รอ lock จน deadline ต้องปฏิเสธ | TEST-18 |
| AC-16 | Anonymous/Organizer ถูกปฏิเสธ; spoof participant/status ถูก 400; ทุกกรณีไม่เปลี่ยน DB | TEST-19 |
| AC-17 | สอง Participant แย่งที่นั่งสุดท้าย สำเร็จ 1 ถูกปฏิเสธ 1 และ count ไม่เกิน capacity; คำขอพร้อมกันของคนเดียวสร้างได้รายการเดียว | TEST-20, TEST-21 |
| AC-18 | List/detail ตรงข้อมูลที่ persist แล้วของตนและอ่านได้หลัง refresh/re-login | TEST-22, TEST-24 |
| AC-19 | ไม่เห็น record ของคนอื่นใน list และเข้าถึง detail ผ่าน direct ID ไม่ได้; anonymous 401, Organizer 403 | TEST-23 |
| AC-20 | ไม่มี registration แสดง empty state; failed fetch แสดง error/retry โดยไม่แสดงข้อมูลของ session ก่อน | TEST-25 |
| AC-21 | เจ้าของเห็น roster เฉพาะ event ที่ขอและ ACTIVE count ตรง DB; ไม่มีรายการแสดง empty/count=0 | TEST-26, TEST-28 |
| AC-22 | Organizer อื่นได้ 404; Participant ได้ 403; anonymous ได้ 401 และ response ไม่เปิดเผยรายชื่อ | TEST-27 |
| AC-23 | หลังมี registration ใหม่ reload แล้ว roster/count เปลี่ยนตรง DB โดยไม่มีข้อมูล private เกิน contract | TEST-29 |
| AC-24 | Journey Organizer publish → Participant register/read → Organizer roster ทำได้ผ่าน UI จริง | TEST-30 |
| AC-25 | DB record และยอดคงเดิมหลัง restart แอป; ผู้ทดสอบติดตั้งจากเอกสารบน environment ใหม่แล้วทำ journey ได้ | TEST-31, TEST-35 |
| AC-26 | Errors รวม 500 ตรง schema/code และไม่แสดง secrets/SQL/traceback; UI อธิบาย rejection/role restrictions ได้ | TEST-32, TEST-33 |
| AC-27 | ทุก AC มี test/ผลจริง/commit; D1 มี review/integration/release และเปิดเผย failed/skipped/incomplete ตามจริง | TEST-34 |

### 2. Product Definition of Done

| ID | เงื่อนไข | หลักฐานที่ต้องตรวจ |
|---|---|---|
| DOD-01 | Feature ทำงานตามทุก AC ที่รับใน Sprint พร้อม normal/negative/boundary cases | AC results และ program demonstrations |
| DOD-02 | Unit/API/database และ selected UI/E2E tests รันจริง ไม่ใช้ stub/mock-only แทน persistence/access | Actual file/name, commands, pass/fail/skipped counts, commit |
| DOD-03 | Last-seat/duplicate race รักษา DB invariant | PostgreSQL multi-connection tests และ DB count |
| DOD-04 | Login/Logout/expiry และ backend roles/ownership ใช้งานได้ | Session และ access tests ไม่ใช่แค่ซ่อนปุ่ม |
| DOD-05 | Data ยังอยู่เมื่อ restart แอป และ setup/seed ทำซ้ำได้ | Restart/reproduction record โดยเพื่อนร่วมทีม |
| DOD-06 | เก็บ meaningful TDD สำหรับกฎ เช่น last-seat/duplicate | Intended assertion แดงก่อน implementation/correction และเขียวหลัง พร้อม versions |
| DOD-07 | Issue/branch/PR ได้ teammate review ที่มีเนื้อหา แล้ว integration tests/acceptance ผ่านก่อน release main | GitHub IDs, authors/reviewers, review content, merge/release commit |
| DOD-08 | SRS/SDS/contracts/traceability/README อัปเดตตรงกับ release | Document revision และ baseline review |
| DOD-09 | ระบุ limitations/failed/skipped/incomplete งานและไม่ใส่ secrets ใน Git/PDF | Defect register และ safe access review |
| DOD-10 | ตั้งแต่ Lab 5 เป็นต้นไปมี CI gate, Docker/GCP version และ post-deploy verification; final มี independent acceptance และส่งมอบครบ | Pipeline/deployment/UAT records ตาม checkpoint; D1 ส่วนนี้เป็น PLANNED ไม่อ้างผ่าน |

**สถานะ:** ไม่ประกาศ DoD ทั้งชุดผ่าน. DOD-05 PARTIAL: automated app recreation มีหลักฐาน แต่ OS-process restart/independent clean reproduction ยังขาด; DOD-07 PARTIAL: PR #7/#10 approved/merged staging แล้ว แต่ reviewed main release ยังขาด. AC-25/26/27 และ GAP-02 คง limitations ตาม [evidence register](evidence-register.md).

---

## Part F: Working Sprint 1 & Verification Evidence

### 1. Program Demonstrations — scope of actual evidence

| Scenario | Expected / actual recorded evidence | Source / limitations |
|---|---|---|
| Normal journey | Organizer create/publish → Participant register → own list/detail/re-login → owner roster; reference/count ตรง DB | TEST-30 real automated browser journey PASS ที่ recorded source3313288; ไม่ใช่ independent UAT |
| Domain rejection | Duplicate ALREADY_REGISTERED, full EVENT_FULL, deadline REGISTRATION_CLOSED พร้อม409 และไม่มี unwanted DB write | registration.test.ts TEST-16–21 และ browser stale-full case; capacity/fixtures ตาม source จริง |
| Access restriction | Anonymous401; Participant owner endpoint403; other Organizer roster404; foreign participant reference404; Logout แล้ว session ใช้ต่อไม่ได้ | auth.test.ts / registration-views.test.ts / browser tests และ EV-01–03 ใน evidence register |
| Persistence | อ่านกลับหลัง reload/re-login/createApp recreation ได้ | ยังไม่ใช่ OS-process restart; TEST-31/35 และ GAP-02 ยัง OPEN |

ภาพ/output, fixtures, AC และ actual results อ้าง [evidence register](evidence-register.md) กับ [recorded verification](../registration/views-verification.md); รายงานนี้ไม่สร้าง manual execution ใหม่จาก scenario descriptions.

---

### 2. Build & Automated Test Results

* **Execution Commands:**
  ```bash
  # รัน Unit และ Integration Tests ทั้งหมด
  npm test
  # รัน Browser End-to-End Tests ทั้งหมด
  npm run test:e2e
  # รัน Typecheck และ Production Build
  npm run typecheck && npm run build
  ```
* **Recorded Summary Results (8 พ.ย. 2026; tested application/test source committed as `331328812092c04db84859c4ca00e9a6aa70b0fe`):**
  * **Vitest (Unit & Integration Tests):** **159 PASS** / 0 Fail / 0 Skip
  * **Playwright (Browser E2E Tests):** **37 PASS** / 0 Fail / 0 Skip
  * **TypeScript Typecheck:** PASS (No errors found)
  * **Production Build:** Client & Server compilation successful

---

### 3. Code Excerpts of Automated Tests

**Actual excerpts — EV-07 / EV-08**

คัดตรงจาก Git commit `331328812092c04db84859c4ca00e9a6aa70b0fe`; recorded execution 8 พ.ย. 2026: full Vitest159 PASS/0 FAIL/0 SKIP ตาม [vitest.log](../registration/evidence/review-fixes/vitest.log). โค้ดด้านล่างเป็น test bodies จริง; imports/fixtures/helpers คงอยู่ใน source file ไม่ใช่ standalone scripts. รอบแก้เอกสารนี้ไม่ได้รัน tests ใหม่.

Domain fixture สร้าง PUBLISHED capacity1 และ race helper ใช้ separate PostgreSQL connections/row-lock barrier; role test ใช้ login/session จริงและ fixture references. error helper ตรวจ status และ exact error envelope.

**AC-17 / BR-05, BR-10** — `server/tests/integration/registration.test.ts` — `allocates exactly one last seat across separate connections (TEST-20)`

```ts
  it('allocates exactly one last seat across separate connections (TEST-20)', async () => {
    const event = await fixture(1);
    let responses: request.Response[] = [];
    await race(event.id, 2, async () => {
      responses = await Promise.all([post(app(a), event.id).send({}), post(app(b, participantB), event.id).send({})]);
    });
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)!.body.error.code).toBe('EVENT_FULL');
    const records = await db.registration.findMany({ where: { eventId: event.id } });
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe(responses.find((r) => r.status === 201)!.body.data.id);
  });
```

**AC-19, AC-22, AC-26** — `server/tests/integration/registration-views.test.ts` — `TEST-23/27/32: enforces auth → role → input → ownership without private data`

```ts
it('TEST-23/27/32: enforces auth → role → input → ownership without private data', async () => {
  const pa = await login(participant), oa = await login(owner), ob = await login(otherOwner);
  const ownPaths = ['/api/my/registrations', `/api/my/registrations/${references[0]}`];
  const roster = `/api/organizer/events/${events[0]}/registrations`;
  for (const path of [...ownPaths, roster]) error(await request(runtime.app).get(path), 401, 'AUTH_REQUIRED');
  for (const path of ownPaths) error(await oa.agent.get(path), 403, 'ROLE_FORBIDDEN');
  error(await pa.agent.get(`/api/my/registrations/${references[2]}`), 404, 'REGISTRATION_NOT_FOUND');
  error(await pa.agent.get(`/api/my/registrations/${randomUUID()}`), 404, 'REGISTRATION_NOT_FOUND');
  error(await pa.agent.get('/api/my/registrations/invalid'), 400, 'INVALID_INPUT');
  error(await oa.agent.get('/api/my/registrations/invalid'), 403, 'ROLE_FORBIDDEN');
  error(await ob.agent.get(roster), 404, 'EVENT_NOT_FOUND');
  error(await pa.agent.get(roster), 403, 'ROLE_FORBIDDEN');
  error(await oa.agent.get('/api/organizer/events/invalid/registrations'), 400, 'INVALID_INPUT');
  error(await oa.agent.get(`/api/organizer/events/${randomUUID()}/registrations`), 404, 'EVENT_NOT_FOUND');
});
```



---

### 4. Git Workflow & Peer Review History (บันทึกตามประวัติ Git และ PR จริง)

#### Chain 1: Issue #3 (Atomic Registration Engine — Feature F-03)
* **Issue Link:** [#3 Feature: Atomic Registration Engine](https://github.com/jetanin/LoungCheu/issues/3)
* **Feature Branch:** `feature/registration`
* **Author / Developer:** นายเจตนินทร์ นายโท (`jetanin`)
* **Pull Request:** [PR #7](https://github.com/jetanin/LoungCheu/pull/7) รวมเข้าสู่ `sprint-1-staging`
* **Teammate Reviewer:** นายปภังกร ล่วนเส้ง (`i3artuf`)
* **Substantive Review Finding:** ตรวจสอบตรรกะการทำ Database transaction lock ในการจองที่นั่ง, ตรวจสอบลำดับการตรวจเช็ค deadline ➡️ duplicate ➡️ capacity, ตรวจสอบการส่งกลับ HTTP 409 Conflict และความครอบคลุมของ Vitest 110 tests
* **Staging Integration Merge:** Merge commit `ada659b` ดำเนินการโดย นายปภังกร ล่วนเส้ง (6 พ.ย. 2026)

#### Chain 2: Issue #4 (Registration Views & Organizer Roster — Feature F-04, F-05)
* **Issue Link:** [#4 Feature: My Registrations and Organizer Roster](https://github.com/jetanin/LoungCheu/issues/4)
* **Feature Branch:** `feature/registration-views`
* **Author / Developer:** นายเจตนินทร์ นายโท (`jetanin`)
* **Pull Request:** [PR #10](https://github.com/jetanin/LoungCheu/pull/10) รวมเข้าสู่ `sprint-1-staging`
* **Teammate Reviewer:** นายปภังกร ล่วนเส้ง (`i3artuf`)
* **Substantive Review:** i3artuf ตรวจ server ownership/minimal fields, roster snapshot/role guards และการแก้ session helper ก่อนสลับบัญชี; approval10พ.ย.16:25:38 Bangkok ที่ reviewed head0bd3468. RV-01–03 และ159/37เป็น recorded correction/execution ที่ source3313288; ไม่อ้างว่า reviewer เป็นผู้ค้นพบทุก finding หรือเป็นการรันใหม่ที่ staging merge. [Structured review/merge snapshots](evidence/review-merge-20261112/README.md)
* **Staging Integration Merge:** Merge commit `97a5b91` ดำเนินการโดย นายปภังกร ล่วนเส้ง (10 พ.ย. 2026)

---

### 5. Contributions & Team Participation Table (บันทึกตามข้อเท็จจริงใน Git Commit History)

| Member | Responsibilities & Actual Contributions (บันทึกตาม Git Commit History) | Evidence in Repository |
|:---|:---|:---|
| **นายปภังกร ล่วนเส้ง**<br>(Paphangkorn Luanseng)<br>รหัสนักศึกษา: 67070501083<br>GitHub: `i3artuf` | **1. System Architecture & Baseline Documentation Lead:**<br>- ยกร่างและปรับแต่งเอกสารวิศวกรรมหลัก SRS, SDS, NFR, Traceability Matrix, Three-Sprint Plan ตั้งแต่ v0.3–v0.5 (commits `a88551c`, `550a8b9`, `a14cc5f`, `be9536c`, `2c25b16`, `f5339b9`)<br>**2. Core Feature Implementation:**<br>- **Feature F-01 (Auth Module - PR #6):** พัฒนา Monorepo workspace tooling, Express Auth Module, Session Store, Prisma initial migration (`202611060001_auth`), React Login UI, และ Playwright Auth E2E test (commits `9f2b33c`, `1a9109a`, `61ef5a3`, `5c34a8d`, `6eac597`, `528419d`)<br>- **Feature F-02 (Event Management - PR #8):** พัฒนา Event API, Schedule Form, Responsive Organizer Overview, Mock Demo Seed, และ Playwright E2E suites สำหรับ Event (commits `c9ea93a`, `41aeb91`, `d5ab8bb`, `6542d6b`, `bee127d`, `de7dcd9`, `8668cb7`, `e6e263a`, `9fcbfc8`, `e46817d`, `fa6f01d`, `91531a7`, `ad1e99f`, `b36d592`)<br>**3. Quality Assurance, Teammate Reviewer & Staging Integrator:**<br>- ทำหน้าที่เป็น Peer Reviewer สำหรับ PR #7 และ PR #10 อย่างละเอียด และตรวจรับการแก้ไขตาม review records<br>- ตรวจรับการแก้บั๊ก รัน integration checks และทำ Staging Integration Merge เข้าสู่ `sprint-1-staging` (commits `ada659b`, `97a5b91`) | Commits ใน feature/staging history (`i3artuf`), Code reviews บน PR #7 และ PR #10, Staging merge commits (`ada659b`, `97a5b91`), Test suites ใน `server/tests/` และ `tests/e2e/` |
| **นายเจตนินทร์ นายโท**<br>(Jetanin Naitho)<br>รหัสนักศึกษา: 67070501011<br>GitHub: `@jetanin` | **1. Project Foundation & Repository Setup:**<br>- สร้าง GitHub Repository (`dafbf4f`) และจัดทำ initial requirements draft (`002c698`)<br>**2. Core Feature Implementation:**<br>- **Feature F-03 (Atomic Registration - PR #7):** พัฒนาระบบลงทะเบียนกิจกรรมแบบ Transaction Lock ป้องกัน Overbooking และ Duplicate Registration, สร้าง REST API `/api/events/:id/registrations` และ Registration UI Action Component (commits `b6ad6e7`, `f482461`, `afa5c72`, `9f8c4e3`)<br>- **Feature F-04 & F-05 (Registration Views & Roster - PR #10):** พัฒนาระบบ My Registrations (own list/detail) และ Event Attendee Roster สำหรับ Organizer, แก้ไข connection limit สำหรับ concurrency tests, และดำเนินการแก้ไข review findings RV-01 ถึง RV-03 (commits `eeafc31`, `32327d4`, `3313288`, `f6a245f`, `0bd3468`)<br>**3. Teammate Reviewer & Baseline Integrator:**<br>- ตรวจสอบและ Merge PR #5 (Docs Baseline), PR #6 (Auth Module), และ PR #8 (Event Management) เข้าสู่ staging branch | Commits บน feature branches (`jetanin`), Author ของ PR #7 และ PR #10, Merge commits ของ PR #5, #6, #8 (`5395942`, `6e8a24c`, `8104f9c`) |

---

### 6. AI-Use Declaration

ใช้ Codex ช่วยอ่าน baseline/ออกแบบและปรับเอกสาร, implementation, tests, audit, แก้ review findings, รัน automated checks และจัดหลักฐาน ตาม [auth work record](../sprints/sprint-1/auth-work-record.md), [Event audit](../events/audit.md), [registration verification](../registration/views-verification.md) และ [Changelog](../changelog.md). ทีมรับผิดชอบเข้าใจ code/tests และตรวจรับงานผ่าน substantive human teammate review: i3artuf ตรวจ PR #7/#10 ด้าน domain rules/transaction/concurrency/ownership/minimal response fields และ assertions พร้อมเหตุผลอนุมัติใน snapshots. AI execution/review ไม่ใช่ independent clean reproduction/UAT และไม่ทำให้ Product DoD ผ่านอัตโนมัติ.

### 7. Setup and Remaining Acceptance Evidence

**Setup commands from README**

รันที่ repository root หลังติดตั้ง Node22 ตาม engines และเตรียม PostgreSQL/app database, private `server/.env` จาก template พร้อม DATABASE_URL/SESSION_SECRET/APP_ORIGIN/DEMO_SEED_PASSWORD. Test database ต้องแยกจาก app DB. `db:setup:test` ต้องใช้ instance ที่เปิดอยู่และสิทธิ์สร้าง test database หรือเตรียมเองตาม README; ไม่ใช่คำสั่งเปิด PostgreSQL.

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run db:setup:test
npm run db:migrate:test
npm run db:seed
npm run dev
```

```sh
npm run typecheck
npm test
npm run build
npm run test:built
npm run test:e2e
```

รายการนี้เป็นขั้นตอนจาก README/package.json ไม่ใช่หลักฐาน clean reproduction ที่รันผ่านรอบนี้; TEST-31/35 ยังต้องมี tester/date/revision/actual results. เก็บ credentials เป็น private environment/handoff ไม่ใส่ในรายงาน.


| Gate | Current evidence / status |
|---|---|
| GAP-02 / TEST-31, TEST-35 / DOD-05 | OPEN/PARTIAL: OS-process restart และ independent clean reproduction ยังไม่มี tester/date/revision/commands/results; automated recreation ใช้แทนไม่ได้ |
| DOD-07 / AC-27 | PARTIAL: PR #7/#10 approved/merged staging มีหลักฐาน; reviewed main release/accepted submitted commit ยังขาด |
| Final board status / release-linked tests | NOT VERIFIED; ไม่อนุมาน Done จาก closed issues หรือผล tests ของ3313288 |
| Independent UAT / exhaustive manual matrix | ยังไม่รัน/ยังไม่ครบตาม verification; ไม่ประกาศผ่านจาก automated subset |

รอบแก้เอกสาร/merge14พ.ย.2026 ไม่ได้รันทดสอบแอปใหม่ และไม่ย้ายผล159/37ไปอ้างเป็นผลที่ merge97a5b91 หรือ release tag ที่ยังไม่ยืนยัน.
